"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = useCallback(async (u: User) => {
    if (!supabase) return;
    const defaultUsername = (u.email?.split("@")[0] ?? "user").slice(0, 20);

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: u.id, username: defaultUsername }, { onConflict: "id", ignoreDuplicates: true });

    if (upsertError) {
      console.error("[auth] profile upsert failed:", upsertError.message, upsertError.code);
    }

    const { data, error: selectError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", u.id)
      .maybeSingle();

    if (selectError) {
      console.error("[auth] profile select failed:", selectError.message, selectError.code);
    }

    setUsername(data?.username ?? defaultUsername);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchOrCreateProfile(u);
      if (active) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Initial session is already handled by getSession() above.
      if (event === "INITIAL_SESSION") return;

      // Supabase silently refreshes the session token on tab focus, firing
      // TOKEN_REFRESHED/USER_UPDATED for the same user. Update the user
      // reference but skip the loading flash and profile refetch — nothing
      // user-facing has changed.
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
        return;
      }

      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setLoading(true);
        await fetchOrCreateProfile(u);
      } else {
        setUsername(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: "auth not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    if (!supabase) return { error: "auth not configured" };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signInWithGoogle() {
    if (!supabase) return { error: "auth not configured" };
    const isProd = process.env.NODE_ENV === "production";
    const redirectTo = isProd ? "https://typoko.com/" : "http://localhost:3000/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  async function updateUsername(newUsername: string) {
    if (!supabase) return { error: "auth not configured" };
    if (!user) return { error: "not signed in" };
    const trimmed = newUsername.trim().slice(0, 20);
    if (!trimmed) return { error: "username cannot be empty" };
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: trimmed });
    if (error) {
      console.error("[auth] updateUsername failed:", error.message, error.code);
    } else {
      setUsername(trimmed);
    }
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{ user, username, loading, signIn, signUp, signInWithGoogle, signOut, updateUsername }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
