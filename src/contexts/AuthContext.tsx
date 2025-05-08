
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define a simpler User type for our app that doesn't rely on the types.ts file
interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'officer' | 'dispatch';
  badge_number?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        // If session exists but no user, we'll fetch the profile separately
        if (currentSession?.user) {
          // Don't fetch profile here to avoid infinite recursion
          // Just update that user is authenticated
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.user_metadata?.name || '',
            role: 'officer', // Default role
          });
          
          // Use setTimeout to avoid potential deadlocks with auth state changes
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession && currentSession.user) {
          setSession(currentSession);
          
          // Set basic user info
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.user_metadata?.name || '',
            role: 'officer', // Default role
          });
          
          // Then fetch the complete profile
          fetchUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Separate function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      // Use RPC call instead of direct table access to avoid RLS issues
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUser({
          id: userId,
          email: session?.user?.email || '',
          name: data.name,
          role: data.role as 'admin' | 'officer' | 'dispatch',
          badge_number: data.badge_number,
          created_at: data.created_at
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success('تم تسجيل الدخول بنجاح', {
        position: 'top-center'
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('فشل تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
