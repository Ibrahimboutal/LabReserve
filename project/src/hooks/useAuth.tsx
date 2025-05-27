'use client';
import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { users } from '../types';
import Box from '@mui/material/Box';
import { AuthContextType } from '../types';
import CircularProgress from '@mui/material/CircularProgress';
import { createClient } from '@supabase/supabase-js';


const AuthContext = createContext<AuthContextType | undefined>(undefined);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<users | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from DB using Supabase auth session
  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        return;
      }

      setUser(data as users);
    } catch (err) {
      console.error('Unexpected error in fetchUser:', err);
      setUser(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      // Skip auto-login if it's a recovery link
      setLoading(false);
      return;
    }
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

    

      if (error || !session?.user) {
        setLoading(false);
        return;
      }

      await fetchUser(session.user.id);
      setLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign In
  const signIn = async (email: string, password: string) => {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });



    if (error) throw error;
  };

  const signUp = async (email: string, password: string, department: string) => {
  const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (signUpError) throw signUpError;
  if (!authUser) throw new Error('No user returned after sign up');

  // Use service role client to bypass RLS
  const serviceRoleSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Optional: Check if user already exists
  const { data: existingUser } = await serviceRoleSupabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingUser) {
    console.warn('User already exists in public.users');
    await fetchUser(authUser.id);
    return;
  }

  // Insert into public.users
  const { error: profileError } = await serviceRoleSupabase
    .from('users')
    .insert({
      id: authUser.id,
      email,
      role: 'student',
      department,
    });

  if (profileError) {
    console.error('Error inserting into public.users:', profileError);
    await supabase.auth.admin.deleteUser(authUser.id);
    throw profileError;
  }

  await fetchUser(authUser.id);
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });


    if (error && !error.message.includes('session_not_found')) {
      throw error;
    }

    setUser(null);
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  // Resend Confirmation Email
  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      resendConfirmation,
    }),
    [user, loading]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}