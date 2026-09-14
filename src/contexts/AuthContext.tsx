import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type AuthError, type Session, type User } from "@supabase/supabase-js";
import { clearStoredSupabaseAuth, supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getAppUrl } from "@/lib/siteUrl";
import { clearAppQueryCache } from "@/lib/queryClient";
import { getCountryByCode } from "@/lib/international";

type AppRole = "owner" | "manager" | "cashier" | "staff" | "hr";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ShopRow = Database["public"]["Tables"]["shops"]["Row"];
type ProfileWithShop = ProfileRow & { shops?: ShopRow | null };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionExpired: boolean;
  shopId: string | null;
  profile: ProfileWithShop | null;
  role: AppRole | null;
  isOwner: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    shopName: string,
    countryCode?: string,
    referralCode?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: (intent?: "login" | "signup", referralCode?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileWithShop | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const authVersionRef = useRef(0);

  const fetchProfile = async (userId: string) => {
    try {
      let { data } = await supabase
        .from("profiles")
        .select("*, shops(*)")
        .eq("id", userId)
        .maybeSingle();

      if (!data) {
        const response = await supabase
          .from("profiles")
          .select("*, shops(*)")
          .eq("user_id", userId)
          .maybeSingle();
        data = response.data;
      }

      if (!data) {
        setProfile(null);
        setShopId(null);
        setRole(null);
        return;
      }

      let resolvedProfile = data as ProfileWithShop;
      if (!resolvedProfile.shops && resolvedProfile.shop_id) {
        const { data: shop } = await supabase
          .from("shops")
          .select("*")
          .eq("id", resolvedProfile.shop_id)
          .maybeSingle();

        if (shop) {
          resolvedProfile = { ...resolvedProfile, shops: shop };
        }
      }

      const { data: roleData } = await (supabase.from("user_roles" as any) as any)
        .select("role, shop_id")
        .eq("user_id", userId)
        .maybeSingle();

      const userRole = (roleData?.role as AppRole) ?? null;
      const userShopId = resolvedProfile.shop_id || roleData?.shop_id || null;

      if (!userRole || !userShopId) {
        if (import.meta.env.DEV) {
          console.warn("fetchProfile: User has no active shop or role. Signing out deleted user.");
        }
        clearStoredSupabaseAuth();
        clearAppQueryCache();
        await supabase.auth.signOut();
        setProfile(null);
        setShopId(null);
        setRole(null);
        setUser(null);
        setSession(null);
        return;
      }

      setProfile(resolvedProfile);
      setShopId(userShopId);
      setRole(userRole);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("fetchProfile error:", error);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authVersionRef.current += 1;

      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        clearAppQueryCache();
        setSessionExpired(true);
      }

      if (event === "SIGNED_IN") {
        clearAppQueryCache();
        setSessionExpired(false);
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => {
          void fetchProfile(nextSession.user.id);
        }, 0);
      } else {
        clearAppQueryCache();
        setShopId(null);
        setProfile(null);
        setRole(null);
      }

      setLoading(false);
    });

    void supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      const bootstrapVersion = authVersionRef.current;

      if (!isMounted) return;

      if (!initialSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (!isMounted || bootstrapVersion !== authVersionRef.current) return;

      const resolvedSession = refreshData.session ?? initialSession;
      const resolvedUser = resolvedSession?.user ?? null;

      if (resolvedSession && resolvedUser) {
        setSession(resolvedSession);
        setUser(resolvedUser);
        setSessionExpired(false);
        void fetchProfile(resolvedUser.id);
        setLoading(false);
        return;
      }

      if (refreshError) {
        clearStoredSupabaseAuth();
        await supabase.auth.signOut();
      }

      if (!isMounted || bootstrapVersion !== authVersionRef.current) return;

      setSession(null);
      setUser(null);
      setShopId(null);
      setProfile(null);
      setRole(null);
      setSessionExpired(Boolean(initialSession));
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      await fetchProfile(currentSession.user.id);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    shopName: string,
    countryCode: string = "TZ",
    referralCode?: string
  ) => {
    const redirectUrl = getAppUrl();
    const country = getCountryByCode(countryCode);
    const sanitizedReferralCode = referralCode?.trim() ? referralCode.trim().toUpperCase() : null;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          shop_name: shopName,
          country_code: country.value,
          currency: country.currency,
          locale: country.locale,
          referred_by_code: sanitizedReferralCode,
          referral_code: sanitizedReferralCode,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error };
    }

    if (data.session && data.user) {
      // 1. Verify this user account is active in a shop and has an assigned role
      const [roleRes, profRes] = await Promise.all([
        (supabase.from("user_roles" as any) as any)
          .select("role, shop_id")
          .eq("user_id", data.user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, shop_id")
          .or(`id.eq.${data.user.id},user_id.eq.${data.user.id}`)
          .maybeSingle(),
      ]);

      const activeRole = roleRes.data?.role;
      const activeShopId = roleRes.data?.shop_id || profRes.data?.shop_id;

      if (!activeRole || !activeShopId) {
        // Account has been removed/deleted from the shop
        await supabase.auth.signOut();
        clearStoredSupabaseAuth();
        clearAppQueryCache();
        setSession(null);
        setUser(null);
        setProfile(null);
        setShopId(null);
        setRole(null);
        setLoading(false);
        return {
          error: new Error("ACCOUNT_DOES_NOT_EXIST"),
        };
      }

      authVersionRef.current += 1;
      setSession(data.session);
      setUser(data.user);
      setSessionExpired(false);
      await fetchProfile(data.user.id);
      setLoading(false);
    }

    return { error: null };
  };

  const signInWithGoogle = async (intent: "login" | "signup" = "login", referralCode?: string) => {
    const activeRef = (referralCode || localStorage.getItem("wisecash_referral_code") || "").trim().toUpperCase();
    if (activeRef) {
      try {
        localStorage.setItem("wisecash_referral_code", activeRef);
      } catch {}
    }

    const refQuery = activeRef ? `&ref=${encodeURIComponent(activeRef)}` : "";
    const redirectUrl = `${getAppUrl()}/auth/oauth-setup?intent=${intent}${refQuery}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error };
  };

  const signOut = async () => {
    clearStoredSupabaseAuth();
    clearAppQueryCache();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setShopId(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionExpired, shopId, profile, role, isOwner: role === "owner", signUp, signIn, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
