import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type AuthError, type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getAppUrl } from "@/lib/siteUrl";

type AppRole = "owner" | "manager" | "cashier" | "staff" | "hr";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ShopRow = Pick<Database["public"]["Tables"]["shops"]["Row"], "id" | "name">;
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
  signUp: (email: string, password: string, fullName: string, shopName: string) => Promise<{ error: AuthError | null }>;
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
          .select("id, name")
          .eq("id", resolvedProfile.shop_id)
          .maybeSingle();

        if (shop) {
          resolvedProfile = { ...resolvedProfile, shops: shop };
        }
      }

      setProfile(resolvedProfile);
      setShopId(resolvedProfile.shop_id);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("shop_id", resolvedProfile.shop_id)
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
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        setSessionExpired(true);
      }

      if (event === "SIGNED_IN") {
        setSessionExpired(false);
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => {
          void fetchProfile(nextSession.user.id);
        }, 0);
      } else {
        setShopId(null);
        setProfile(null);
        setRole(null);
      }

      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        void fetchProfile(initialSession.user.id);
      }

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

  const signUp = async (email: string, password: string, fullName: string, shopName: string) => {
    const redirectUrl = getAppUrl();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, shop_name: shopName },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
