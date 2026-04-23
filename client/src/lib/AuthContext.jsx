import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { setPrimaryOrganization as rpcSetPrimaryOrganization } from '../features/academy/hooks/useInvitations';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRef = useRef(null);

  // Organization state
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // Persist activeOrg selection across page refreshes
  useEffect(() => {
    if (activeOrg?.id) {
      localStorage.setItem('activeOrgId', activeOrg.id);
    }
  }, [activeOrg?.id]);

  // Fetch user profile from profiles table (non-blocking)
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      profileRef.current = null;
      return null;
    }

    // Only show loading spinner on initial load, not background refreshes
    // This prevents AdminProtectedRoute from unmounting children mid-use
    if (!profileRef.current) {
      setProfileLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
        profileRef.current = null;
        return null;
      }

      setProfile(data);
      profileRef.current = data;
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      profileRef.current = null;
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch user's organizations via RPC (non-blocking)
  const fetchOrganizations = async () => {
    setOrgsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_organizations');
      if (error) {
        console.error('Error fetching organizations:', error.message);
        setOrganizations([]);
        return;
      }
      setOrganizations(data || []);
      // Selection order: prior selection → localStorage override → server primary → first
      if (data?.length > 0) {
        setActiveOrg((prev) => {
          if (prev) {
            const refreshed = data.find((o) => o.id === prev.id);
            if (refreshed) return refreshed;
          }
          const savedId = localStorage.getItem('activeOrgId');
          const saved = savedId && data.find((o) => o.id === savedId);
          if (saved) return saved;
          const primary = data.find((o) => o.is_primary);
          return primary || data[0];
        });
      } else {
        setActiveOrg(null);
        localStorage.removeItem('activeOrgId');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setOrganizations([]);
    } finally {
      setOrgsLoading(false);
    }
  };

  useEffect(() => {
    // Check if supabase.auth is available (handles missing credentials gracefully)
    if (!supabase.auth) {
      console.error('Supabase auth not initialized. Check your credentials.');
      setLoading(false);
      return;
    }

    // Get initial session - DON'T wait for profile fetch to show UI
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error.message);
          // Still allow app to render - user will just appear logged out
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false IMMEDIATELY after getting session
        // This allows the UI to render while profile loads in background
        setLoading(false);
        
        // Fetch profile and organizations in background (non-blocking)
        if (session?.user) {
          fetchProfile(session.user.id);
          fetchOrganizations();
        } else {
          setOrgsLoading(false);
        }
      })
      .catch((err) => {
        // Handle any unexpected errors (e.g., localStorage unavailable on mobile)
        console.error('Failed to get session:', err);
        setLoading(false);
        // App will render as logged out - user can try logging in again
      });

    // Listen for auth state changes
    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Fetch profile and organizations in background (non-blocking)
          if (session?.user) {
            fetchProfile(session.user.id);
            fetchOrganizations();
          } else {
            setProfile(null);
            profileRef.current = null;
            setOrganizations([]);
            setActiveOrg(null);
            setOrgsLoading(false);
          }
        }
      );
      subscription = data?.subscription;
    } catch (err) {
      console.error('Failed to set up auth listener:', err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
    setProfile(null);
    profileRef.current = null;
    setOrganizations([]);
    setActiveOrg(null);
    setOrgsLoading(false);
    localStorage.removeItem('activeOrgId');
  };

  const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) throw error;
    // onAuthStateChange fires when auth.users is deleted, cleaning up state
  };

  // Update user profile in profiles table
  const updateProfile = async (updates) => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setProfileLoading(false);
    }
  };

  const value = {
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
    // Organization state
    organizations,
    activeOrg,
    setActiveOrg,
    orgsLoading,
    refreshOrganizations: fetchOrganizations,
    setPrimaryOrganization: async (orgId) => {
      await rpcSetPrimaryOrganization(orgId);
      await fetchOrganizations();
    },
    isCoach: activeOrg ? ['owner', 'admin', 'coach'].includes(activeOrg.role) : false,
    isOrgAdmin: activeOrg ? ['owner', 'admin'].includes(activeOrg.role) : false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
