import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  checkingRole: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    // 1. Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // 2. THEN read existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      setCheckingRole(false);
      return;
    }
    setCheckingRole(true);
    // Defer to avoid blocking the auth callback
    setTimeout(async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (error) {
        console.warn("has_role check failed", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean(data));
      }
      setCheckingRole(false);
    }, 0);
  }, [session?.user?.id]);

  return {
    user: session?.user ?? null,
    session,
    loading,
    isAdmin,
    checkingRole,
  };
}
