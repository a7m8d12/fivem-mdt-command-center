
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserCog, Shield, BadgeCheck, X } from 'lucide-react';
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
        // First get users from auth.users (using function)
        const { data: authUsers, error: authError } = await supabase.rpc('get_users');
        
        if (authError) throw authError;

        if (!authUsers || authUsers.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }

        // Get profiles from profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Map auth users and profiles
        const userProfiles: UserProfile[] = authUsers.map(authUser => {
          const matchingProfile = profiles?.find(p => p.id === authUser.id) || null;
          
          return {
            id: authUser.id,
            email: authUser.email,
            name: matchingProfile?.name || 'مستخدم غير معروف',
            role: (matchingProfile?.role as 'admin' | 'officer' | 'dispatch') || 'officer',
            badge_number: matchingProfile?.badge_number || '0000',
            created_at: matchingProfile?.created_at || ''
          };
        });

        setUsers(userProfiles);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('فشل في جلب بيانات المستخدمين');
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
              <p>جاري تحميل البيانات...</p>
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
