
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  Users,
  FileText,
  Car,
  ClipboardList,
  AlertTriangle,
  Search,
  BadgeAlert,
  UserX,
  ShieldAlert,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navigation = [
    { name: 'لوحة المعلومات', href: '/dashboard', icon: HomeIcon },
    { name: 'المواطنون', href: '/citizens', icon: Users },
    { name: 'السجلات الجنائية', href: '/criminal-records', icon: UserX },
    { name: 'المركبات', href: '/vehicles', icon: Car },
    { name: 'المخالفات', href: '/citations', icon: ClipboardList },
    { name: 'التقارير', href: '/reports', icon: FileText },
    { name: 'أوامر التوقيف', href: '/warrants', icon: AlertTriangle },
  ];

  // Admin only navigation items
  const adminNavigation = [
    { name: 'إدارة المستخدمين', href: '/admin/users', icon: BadgeAlert },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border/50">
      <div className="h-16 flex items-center justify-center border-b border-border/50">
        <Link to="/dashboard" className="flex items-center space-x-2 rtl:space-x-reverse">
          <ShieldAlert className="h-8 w-8 text-police-blue" />
          <span className="font-bold text-xl text-white">MDT</span>
        </Link>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto py-4">
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                location.pathname === item.href
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white',
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
              )}
            >
              <item.icon 
                className={cn(
                  location.pathname === item.href
                    ? 'text-police-blue'
                    : 'text-sidebar-foreground/70 group-hover:text-white',
                  'ml-3 flex-shrink-0 h-5 w-5'
                )}
                aria-hidden="true"
              />
              <span className="mr-2">{item.name}</span>
            </Link>
          ))}
          
          {/* Admin navigation section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center px-3">
                  <h3 className="text-sm font-medium text-sidebar-foreground/70">
                    إدارة النظام
                  </h3>
                  <div className="ml-auto">
                    <span className="inline-flex items-center rounded-full bg-police-blue/20 px-2 py-1 text-xs font-medium text-police-blue">
                      مسؤول
                    </span>
                  </div>
                </div>
              </div>
              
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    location.pathname === item.href
                      ? 'bg-sidebar-accent text-white'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon 
                    className={cn(
                      location.pathname === item.href
                        ? 'text-police-blue'
                        : 'text-sidebar-foreground/70 group-hover:text-white',
                      'ml-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  <span className="mr-2">{item.name}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-center">
          <div className="text-xs text-sidebar-foreground/70 text-center">
            نظام إدارة البيانات للشرطة
            <div className="mt-1">الإصدار 1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
