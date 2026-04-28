import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isLocalAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Migration: Clear any old local data
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('riderhub_user');
      if (storedUser && (storedUser.includes('local_') || !storedUser.includes('"id"'))) {
        localStorage.clear();
        sessionStorage.clear();
      }
    }

    // 2. Initial session check
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (e) {
        console.error('Initial session error:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 3. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split('@')[0] },
        }
      });
      if (error) throw error;
      return { error: null, needsVerification: !data.session };
    } catch (err: any) {
      return { error: err as Error, needsVerification: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    console.log('Initiating signOut...');
    
    try {
      // 1. Tell Supabase to sign out (with local scope fallback if needed)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('SignOut failed:', e);
    } finally {
      // 2. Clear state manually NO MATTER WHAT
      setUser(null);
      setSession(null);
      
      // 3. Force storage cleanup
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          // Remove specific Supabase keys just in case
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key);
            }
          });
        } catch (err) {
          console.error('Storage cleanup error:', err);
        }
      }
      
      console.log('SignOut completed locally.');
    }
  };

  // Detect if we are in a local development environment or similar
  const isLocalAuth = user?.email?.includes('local_') || false;

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, isLocalAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};