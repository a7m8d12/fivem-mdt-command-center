
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserCog, Shield, BadgeCheck, X, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'officer' | 'dispatch';
  badge_number: string;
  created_at: string;
}

const AdminPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // طريقة بديلة لاسترجاع البيانات تجنباً للتكرار اللانهائي
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, role, badge_number, created_at');
          
        if (error) {
          throw error;
        }

        // إذا لم يتم استرجاع أي بيانات
        if (!profiles || profiles.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }
        
        // استخدام بيانات الملفات الشخصية مع إضافة حقل البريد الإلكتروني
        const userProfiles: UserProfile[] = profiles.map(profile => ({
          id: profile.id,
          email: 'user@example.com', // قيمة افتراضية للبريد الإلكتروني
          name: profile.name || 'مستخدم غير معروف',
          role: (profile.role as 'admin' | 'officer' | 'dispatch') || 'officer',
          badge_number: profile.badge_number || '0000',
          created_at: profile.created_at || ''
        }));

        // لاحقاً يمكن استبدال البريد الإلكتروني من بيانات النظام
        try {
          const { data: authUsers, error: authError } = await supabase.rpc('get_users');
          
          if (!authError && authUsers) {
            const updatedUsers = userProfiles.map(profile => {
              const matchingAuth = authUsers.find((auth: any) => auth.id === profile.id);
              return {
                ...profile,
                email: matchingAuth?.email || 'البريد الإلكتروني غير متاح'
              };
            });
            setUsers(updatedUsers);
          } else {
            setUsers(userProfiles);
          }
        } catch (authError) {
          console.error('Error fetching auth users:', authError);
          setUsers(userProfiles);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('فشل في جلب بيانات المستخدمين');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const filteredUsers = searchQuery
    ? users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.badge_number.includes(searchQuery)
      )
    : users;

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <Shield className="h-4 w-4" />
          <span>مدير</span>
        </div>
      );
    }
    if (role === 'officer') {
      return (
        <div className="flex items-center gap-1 text-police-blue">
          <BadgeCheck className="h-4 w-4" />
          <span>ضابط</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-amber-600">
        <UserCog className="h-4 w-4" />
        <span>مرسل</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserCog className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        </div>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="police-input pr-10"
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center p-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>جاري تحميل البيانات...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id} className={user.id === currentUser?.id ? 'border-police-blue' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between">
                  <span>{user.name}</span>
                  {getRoleBadge(user.role)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between mb-1">
                    <span>البريد الإلكتروني:</span>
                    <span className="font-medium text-foreground">{user.email}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>رقم الشارة:</span>
                    <span className="font-medium text-foreground">{user.badge_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تاريخ التسجيل:</span>
                    <span className="font-medium text-foreground">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center p-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <X className="h-10 w-10 text-muted-foreground" />
                <p>لا توجد نتائج مطابقة للبحث</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
