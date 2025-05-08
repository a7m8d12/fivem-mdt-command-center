
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { 
  LogOut, 
  Bell, 
  User,
  ShieldAlert,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: 'تم إضافة مواطن جديد',
    description: 'تم إضافة المواطن سعد الفهد إلى قاعدة البيانات',
    time: 'قبل 5 دقائق',
    read: false
  },
  {
    id: 2,
    title: 'أمر توقيف جديد',
    description: 'تم إصدار أمر توقيف جديد بحق المواطن خالد المحمد',
    time: 'قبل 20 دقيقة',
    read: false
  },
  {
    id: 3,
    title: 'تحديث النظام',
    description: 'تم تحديث النظام إلى الإصدار 1.0.1',
    time: 'قبل 1 ساعة',
    read: true
  },
  {
    id: 4,
    title: 'تنبيه أمني',
    description: 'يرجى التحقق من هوية المواطنين بدقة نظراً لتزايد محاولات الانتحال',
    time: 'قبل 3 ساعات',
    read: true
  }
];

const DashboardLayout = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Use useEffect for navigation to avoid React warnings
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-medium">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={markAllAsRead}
                    >
                      تعليم الكل كمقروءة
                    </Button>
                  )}
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 border-b last:border-b-0 flex gap-2 ${notification.read ? '' : 'bg-secondary/30'}`}
                    >
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notification.read ? 'bg-transparent' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="px-4 py-6 text-center text-muted-foreground">
                      لا توجد إشعارات جديدة
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
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
