// Simple local storage auth - works without Supabase dashboard access
// This is a fallback that stores users locally in the browser

const STORAGE_KEY = 'riderhub_users';
const SESSION_KEY = 'riderhub_session';

// Helper to get users from localStorage
const getStoredUsers = (): Record<string, { password: string, createdAt: string }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Helper to save users to localStorage  
const saveUser = (email: string, password: string) => {
  const users = getStoredUsers();
  users[email.toLowerCase()] = { 
    password, 
    createdAt: new Date().toISOString() 
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

// Check if user exists
const userExists = (email: string): boolean => {
  const users = getStoredUsers();
  return !!users[email.toLowerCase()];
};

// Validate password (simple hash simulation)
const validatePassword = (email: string, password: string): boolean => {
  const users = getStoredUsers();
  const user = users[email.toLowerCase()];
  return user ? user.password === password : false;
};

// Set current session
const setSession = (email: string) => {
  localStorage.setItem(SESSION_KEY, email.toLowerCase());
};

// Get current session
const getSession = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

// Clear session
const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// Test if localStorage is available
const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Simple mock Supabase auth - uses localStorage
// This works immediately without needing Supabase dashboard config
export const mockAuth = {
  // Sign up - creates user in localStorage
  signUp: async (email: string, password: string) => {
    if (!isStorageAvailable()) {
      return { 
        data: { user: null, session: null }, 
        error: new Error('LocalStorage not available') 
      };
    }

    if (userExists(email)) {
      return { 
        data: { user: null, session: null }, 
        error: new Error('User already registered') 
      };
    }

    // Create user
    saveUser(email, password);
    setSession(email);
    
    return { 
      data: { 
        user: { id: email, email }, 
        session: { access_token: 'mock_token', user: { id: email, email } } 
      }, 
      error: null 
    };
  },

  // Sign in - validates against localStorage
  signInWithPassword: async (email: string, password: string) => {
    if (!isStorageAvailable()) {
      return { 
        data: { user: null }, 
        error: new Error('LocalStorage not available') 
      };
    }

    if (!userExists(email)) {
      return { 
        data: { user: null }, 
        error: new Error('Invalid login credentials') 
      };
    }

    if (!validatePassword(email, password)) {
      return { 
        data: { user: null }, 
        error: new Error('Invalid login credentials') 
      };
    }

    // Success - set session
    setSession(email);
    
    return { 
      data: { 
        user: { id: email, email } 
      }, 
      error: null 
    };
  },

  // Sign out - clears session
  signOut: async () => {
    clearSession();
    return { error: null };
  },

  // Get current session
  getSession: async () => {
    const email = getSession();
    if (!email) {
      return { data: { session: null }, error: null };
    }
    
    return { 
      data: { 
        session: { 
          access_token: 'mock_token', 
          user: { id: email, email } 
        } 
      }, 
      error: null 
    };
  },

  // Listen for auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // Check for existing session on load
    const email = getSession();
    if (email) {
      callback('SIGNED_IN', { access_token: 'mock_token', user: { id: email, email } });
    } else {
      callback('SIGNED_OUT', null);
    }

    // Return unsubscribe function
    return {
      unsubscribe: () => {}
    };
  },
  
  // Check if user exists
  userExists,
};

// Export helper for external use
export const authHelpers = {
  getStoredUsers,
  userExists,
  validatePassword,
  isStorageAvailable,
};