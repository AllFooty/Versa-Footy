"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";

type Profile = {
  id: string;
  is_admin?: boolean;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  [k: string]: unknown;
};

type Organization = {
  id: string;
  name: string;
  role: "owner" | "admin" | "coach" | "member" | string;
  is_primary?: boolean;
  [k: string]: unknown;
};

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  organizations: Organization[];
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization | null) => void;
  orgsLoading: boolean;
  refreshOrganizations: () => Promise<void>;
  isCoach: boolean;
  isOrgAdmin: boolean;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRef = useRef<Profile | null>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [orgsLoading, setOrgsLoading] = useState(true);

  useEffect(() => {
    if (activeOrg?.id) {
      try {
        localStorage.setItem("activeOrgId", activeOrg.id);
      } catch {}
    }
  }, [activeOrg?.id]);

  const fetchProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      profileRef.current = null;
      return null;
    }
    if (!profileRef.current) setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        setProfile(null);
        profileRef.current = null;
        return null;
      }
      setProfile(data as Profile);
      profileRef.current = data as Profile;
      return data as Profile;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_my_organizations");
      if (error) {
        setOrganizations([]);
        return;
      }
      const orgs = (data ?? []) as Organization[];
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setActiveOrg((prev) => {
          if (prev) {
            const refreshed = orgs.find((o) => o.id === prev.id);
            if (refreshed) return refreshed;
          }
          let savedId: string | null = null;
          try {
            savedId = localStorage.getItem("activeOrgId");
          } catch {}
          const saved = savedId ? orgs.find((o) => o.id === savedId) : null;
          if (saved) return saved;
          const primary = orgs.find((o) => o.is_primary);
          return primary ?? orgs[0];
        });
      } else {
        setActiveOrg(null);
        try {
          localStorage.removeItem("activeOrgId");
        } catch {}
      }
    } finally {
      setOrgsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
        if (s?.user) {
          void fetchProfile(s.user.id);
          void fetchOrganizations();
        } else {
          setOrgsLoading(false);
        }
      })
      .catch(() => setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        void fetchProfile(s.user.id);
        void fetchOrganizations();
      } else {
        setProfile(null);
        profileRef.current = null;
        setOrganizations([]);
        setActiveOrg(null);
        setOrgsLoading(false);
      }
    });

    return () => data?.subscription?.unsubscribe();
  }, [fetchProfile, fetchOrganizations]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    profileRef.current = null;
    setOrganizations([]);
    setActiveOrg(null);
    setOrgsLoading(false);
    try {
      localStorage.removeItem("activeOrgId");
    } catch {}
  }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc("delete_user_account");
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("No user logged in");
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", user.id)
          .select()
          .single();
        if (error) throw error;
        setProfile(data as Profile);
        return data as Profile;
      } finally {
        setProfileLoading(false);
      }
    },
    [user?.id],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      signOut,
      deleteAccount,
      updateProfile,
      isAuthenticated: !!user,
      isAdmin: profile?.is_admin === true,
      organizations,
      activeOrg,
      setActiveOrg,
      orgsLoading,
      refreshOrganizations: fetchOrganizations,
      isCoach: activeOrg
        ? ["owner", "admin", "coach"].includes(activeOrg.role)
        : false,
      isOrgAdmin: activeOrg
        ? ["owner", "admin"].includes(activeOrg.role)
        : false,
    }),
    [
      user,
      session,
      profile,
      loading,
      profileLoading,
      signOut,
      deleteAccount,
      updateProfile,
      organizations,
      activeOrg,
      orgsLoading,
      fetchOrganizations,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
