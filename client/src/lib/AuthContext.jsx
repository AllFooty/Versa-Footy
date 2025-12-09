import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile from profiles table (non-blocking)
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
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
        
        // Fetch profile in background (non-blocking)
        if (session?.user) {
          fetchProfile(session.user.id);
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
          
          // Fetch profile in background (non-blocking)
          if (session?.user) {
            fetchProfile(session.user.id);
          } else {
            setProfile(null);
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
  };

  const value = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    signOut,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin === true,
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
