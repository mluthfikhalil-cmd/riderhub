import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Local auth helpers
  isLocalAuth: boolean;
  localUser: LocalUser | null;
}

interface Session {
  access_token: string;
  user: User;
}

interface LocalUser {
  id: string;
  email: string;
  name: string;
  bike?: string;
  location?: string;
  createdAt: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const LOCAL_USER_KEY = 'riderhub_user';
const LOCAL_SESSION_KEY = 'riderhub_session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAuth, setIsLocalAuth] = useState(false);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  // Load local session on mount
  useEffect(() => {
    checkLocalSession();
  }, []);

  const checkLocalSession = () => {
    try {
      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      const storedSession = localStorage.getItem(LOCAL_SESSION_KEY);
      
      if (storedUser && storedSession) {
        const parsedUser = JSON.parse(storedUser);
        setLocalUser(parsedUser);
        setIsLocalAuth(true);
        
        // Convert to Supabase-like user object
        const fakeUser = {
          id: parsedUser.id,
          email: parsedUser.email,
          app_metadata: {},
          user_metadata: { name: parsedUser.name },
          aud: 'authenticated',
          created_at: parsedUser.createdAt,
        } as User;
        
        setUser(fakeUser);
        setSession({
          access_token: storedSession,
          user: fakeUser,
        });
      }
    } catch (e) {
      console.error('Error loading local session:', e);
    }
    setLoading(false);
  };

  // Local signUp - create account in localStorage
  const localSignUp = async (email: string, password: string, name: string) => {
    try {
      // Check if user already exists
      const existingUser = localStorage.getItem(LOCAL_USER_KEY);
      if (existingUser) {
        const parsed = JSON.parse(existingUser);
        if (parsed.email === email) {
          return { error: new Error('Email already registered'), needsVerification: false };
        }
      }

      // Create new local user
      const newUser: LocalUser = {
        id: 'local_' + Date.now(),
        email,
        name: name || email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage (in real app, would hash password)
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(LOCAL_SESSION_KEY, 'local_session_' + Date.now());
      
      // Also store password (for local login - in real app this would be hashed)
      localStorage.setItem('riderhub_password_' + email, password);

      setLocalUser(newUser);
      setIsLocalAuth(true);

      // Create fake session
      const fakeUser = {
        id: newUser.id,
        email: newUser.email,
        app_metadata: {},
        user_metadata: { name: newUser.name },
        aud: 'authenticated',
        created_at: newUser.createdAt,
      } as User;

      setUser(fakeUser);
      setSession({
        access_token: 'local_session_' + Date.now(),
        user: fakeUser,
      });

      return { error: null, needsVerification: false };
    } catch (err) {
      return { error: err as Error, needsVerification: false };
    }
  };

  // Local signIn - login with localStorage
  const localSignIn = async (email: string, password: string) => {
    try {
      const storedPassword = localStorage.getItem('riderhub_password_' + email);
      
      if (!storedPassword) {
        return { error: new Error('Invalid login credentials'), needsVerification: false };
      }

      if (storedPassword !== password) {
        return { error: new Error('Invalid login credentials'), needsVerification: false };
      }

      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (!storedUser) {
        return { error: new Error('User data not found'), needsVerification: false };
      }

      const parsedUser = JSON.parse(storedUser);
      
      if (parsedUser.email !== email) {
        return { error: new Error('Invalid login credentials'), needsVerification: false };
      }

      setLocalUser(parsedUser);
      setIsLocalAuth(true);

      // Create fake session
      const fakeUser = {
        id: parsedUser.id,
        email: parsedUser.email,
        app_metadata: {},
        user_metadata: { name: parsedUser.name },
        aud: 'authenticated',
        created_at: parsedUser.createdAt,
      } as User;

      setUser(fakeUser);
      setSession({
        access_token: 'local_session_' + Date.now(),
        user: fakeUser,
      });
      
      // Save session to localStorage on successful login
      localStorage.setItem(LOCAL_SESSION_KEY, 'local_session_' + Date.now());

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // SignUp - tries local first, then Supabase
  const signUp = async (email: string, password: string) => {
    // Try local signUp first
    const result = await localSignUp(email, password, email.split('@')[0]);
    
    if (result.error) {
      // Try Supabase as fallback
      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
          }
        });
        
        if (error) {
          return { error: error as Error, needsVerification: !!data.user };
        }
        
        setIsLocalAuth(false);
        return { error: null, needsVerification: !!data.user };
      } catch (e) {
        return { error: result.error, needsVerification: false };
      }
    }
    
    return result;
  };

  // SignIn - tries local first, then Supabase
  const signIn = async (email: string, password: string) => {
    // Try local signIn first
    const result = await localSignIn(email, password);
    
    if (!result.error) {
      return { error: null };
    }

    // Try Supabase as fallback
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error: error as Error };
      }
      
      setIsLocalAuth(false);
      return { error: null };
    } catch (e) {
      return result;
    }
  };

  // SignOut
  const signOut = async () => {
    // Clear local session
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setLocalUser(null);
    setIsLocalAuth(false);
    setUser(null);
    setSession(null);

    // Try Supabase signOut (will fail silently if not logged in)
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      isLocalAuth,
      localUser
    }}>
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