import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  shopId: string | null;
  profile: any | null;
  signUp: (email: string, password: string, fullName: string, shopName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setShopId(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Try id first (Lovable: profiles.id = auth.uid()), then user_id (original schema)
      let { data } = await supabase
        .from("profiles")
        .select("*, shops(*)")
        .eq("id", userId)
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("profiles")
          .select("*, shops(*)")
          .eq("user_id", userId)
          .maybeSingle();
        data = res.data;
      }
      if (data) {
        // Ensure shops is available (embed can fail or use different keys)
        if (!(data as { shops?: unknown }).shops && data.shop_id) {
          const { data: shop } = await supabase.from("shops").select("id, name").eq("id", data.shop_id).maybeSingle();
          if (shop) data = { ...data, shops: shop };
        }
        setProfile(data);
        setShopId(data.shop_id);
      }
    } catch (e) {
      console.error("fetchProfile error:", e);
    }
  };

  const refreshProfile = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) await fetchProfile(s.user.id);
  };

  const signUp = async (email: string, password: string, fullName: string, shopName: string) => {
    const redirectUrl = `${window.location.origin}/`;
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setShopId(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, shopId, profile, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
