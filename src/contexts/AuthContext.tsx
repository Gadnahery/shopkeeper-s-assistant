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
  signUp: (email: string, password: string, fullName: string, shopName: string, countryCode?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: (intent?: "login" | "signup") => Promise<{ error: AuthError | null }>;
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

      setProfile(resolvedProfile);
      setShopId(resolvedProfile.shop_id);

      const { data: roleData } = await (supabase.from("user_roles" as any) as any)
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setRole((roleData?.role as AppRole) ?? null);
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
    countryCode: string = "TZ"
  ) => {
    const redirectUrl = getAppUrl();
    const country = getCountryByCode(countryCode);
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
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.session && data.user) {
      authVersionRef.current += 1;
      setSession(data.session);
      setUser(data.user);
      setSessionExpired(false);
      await fetchProfile(data.user.id);
      setLoading(false);
    }

    return { error };
  };

  const signInWithGoogle = async (intent: "login" | "signup" = "login") => {
    const redirectUrl = `${getAppUrl()}/auth/oauth-setup?intent=${intent}`;
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
