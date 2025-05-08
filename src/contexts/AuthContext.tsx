
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a user in localStorage
    const storedUser = localStorage.getItem('mdt_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('mdt_user');
      }
    }
    setLoading(false);
  }, []);

  // Mock sign in for now - will be replaced with Supabase auth
  const signIn = async (email: string, password: string) => {
    try {
      // Mock authentication - will be replaced with actual auth
      if (password.length < 6) {
        throw new Error('Invalid credentials');
      }
      
      // Mock user data
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'officer',
        badge_number: Math.floor(1000 + Math.random() * 9000).toString(),
        created_at: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('mdt_user', JSON.stringify(mockUser));
      
      toast.success('تم تسجيل الدخول بنجاح', {
        position: 'top-center'
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('mdt_user');
    navigate('/login');
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
