import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// @ts-ignore
import { mockAuth } from '../lib/authLocal';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await mockAuth.getSession();
        
        if (error) {
          console.log('Session check error:', error);
          setLoading(false);
          return;
        }

        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user as User);
        }
      } catch (err) {
        console.log('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = mockAuth.onAuthStateChange((event, sessionData) => {
      console.log('Auth event:', event, sessionData);
      
      if (sessionData) {
        setSession(sessionData);
        setUser(sessionData.user as User);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Convert email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user already exists
      if (mockAuth.userExists(normalizedEmail)) {
        return { 
          error: new Error('This email is already registered. Please login instead.'), 
          needsVerification: false 
        };
      }

      const { data, error } = await mockAuth.signUp(normalizedEmail, password);
      
      if (error) {
        return { error: error as Error, needsVerification: false };
      }

      // If sign up successful, user is automatically logged in
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        return { error: null, needsVerification: false };
      }

      return { error: null, needsVerification: false };
    } catch (err) {
      return { error: err as Error, needsVerification: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const { data, error } = await mockAuth.signInWithPassword(normalizedEmail, password);
      
      if (error) {
        return { error: error as Error };
      }

      if (data.user) {
        setUser(data.user);
        return { error: null };
      }

      return { error: new Error('Login failed') };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await mockAuth.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      console.log('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};