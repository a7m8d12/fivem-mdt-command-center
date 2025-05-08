
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isAuthenticated } = useAuth();
  const location = useLocation();

  // Pre-fill with admin credentials for easier testing
  useEffect(() => {
    setEmail('owner@admin.com');
    setPassword('admin123456');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await signIn(email, password);
    } catch (err) {
      setError('فشل تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <ShieldAlert className="h-16 w-16 text-police-blue" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            تسجيل الدخول إلى نظام MDT
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            نظام إدارة البيانات المتنقلة للشرطة
          </p>
        </div>
        
        <div className="police-card p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="police-input pl-10"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="police-input pl-10"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-police-red bg-police-red/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full police-button"
                disabled={isLoading}
              >
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p className="mt-3">
            تحتاج مساعدة؟ اتصل بمسؤول النظام
          </p>
          <p className="mt-1">
            البريد الإلكتروني: owner@admin.com | كلمة المرور: admin123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
