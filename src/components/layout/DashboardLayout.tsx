
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { 
  LogOut, 
  Bell, 
  User,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardLayout = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Use useEffect for navigation to avoid React warnings
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-16 w-16 text-police-blue animate-pulse" />
          <p className="mt-4 text-lg">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, the useEffect will handle redirection
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border/50 h-16 flex items-center px-6 justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold flex items-center">
              <ShieldAlert className="mr-2 text-police-blue" />
              نظام MDT للشرطة
            </h1>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'مسؤول النظام' : 'ضابط'} #{user.badge_number}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-secondary/50 h-10 w-10"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
            
            <Button variant="ghost" onClick={signOut} title="تسجيل الخروج">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
