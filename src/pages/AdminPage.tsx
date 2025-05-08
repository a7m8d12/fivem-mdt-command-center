
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Search,
  Shield,
  UserX,
  UserCog
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User } from '@/types';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'مدير النظام',
    role: 'admin',
    badge_number: '1001',
    created_at: '2023-01-01T08:00:00.000Z',
  },
  {
    id: '2',
    email: 'officer1@example.com',
    name: 'فهد العنزي',
    role: 'officer',
    badge_number: '2034',
    created_at: '2023-02-15T10:30:00.000Z',
  },
  {
    id: '3',
    email: 'officer2@example.com',
    name: 'محمد العلي',
    role: 'officer',
    badge_number: '2045',
    created_at: '2023-03-10T09:45:00.000Z',
  },
  {
    id: '4',
    email: 'officer3@example.com',
    name: 'خالد العبيد',
    role: 'officer',
    badge_number: '2067',
    created_at: '2023-04-05T11:20:00.000Z',
  },
  {
    id: '5',
    email: 'dispatch1@example.com',
    name: 'سارة القحطاني',
    role: 'dispatch',
    badge_number: '3012',
    created_at: '2023-05-20T14:15:00.000Z',
  },
];

const AdminPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('officer');
  const [newUserBadge, setNewUserBadge] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const filteredUsers = searchQuery
    ? mockUsers.filter(user => 
        user.name.includes(searchQuery) || 
        user.email.includes(searchQuery) || 
        user.badge_number.includes(searchQuery))
    : mockUsers;

  const handleCreateUser = () => {
    // Validation
    if (!newUserEmail || !newUserName || !newUserPassword || !newUserBadge) {
      toast.error("الرجاء إكمال جميع الحقول المطلوبة");
      return;
    }
    
    // Mock user creation
    toast.success("تم إنشاء المستخدم بنجاح");
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    
    // Mock user update
    toast.success("تم تحديث بيانات المستخدم بنجاح");
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    // Mock user deletion
    toast.success("تم حذف المستخدم بنجاح");
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const resetForm = () => {
    setNewUserEmail('');
    setNewUserName('');
    setNewUserRole('officer');
    setNewUserBadge('');
    setNewUserPassword('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="badge-blue">مسؤول النظام</Badge>;
      case 'officer':
        return <Badge className="badge-green">ضابط</Badge>;
      case 'dispatch':
        return <Badge className="badge-yellow">موظف اتصالات</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const translateRole = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مسؤول النظام';
      case 'officer':
        return 'ضابط';
      case 'dispatch':
        return 'موظف اتصالات';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="police-button">
              <Plus className="ml-2 h-4 w-4" /> إنشاء مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">إنشاء مستخدم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  placeholder="أدخل اسم المستخدم"
                  className="police-input"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  placeholder="أدخل البريد الإلكتروني"
                  className="police-input"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  className="police-input"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">الدور</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger id="role" className="police-input">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مسؤول النظام</SelectItem>
                      <SelectItem value="officer">ضابط</SelectItem>
                      <SelectItem value="dispatch">موظف اتصالات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge">رقم الشارة</Label>
                  <Input
                    id="badge"
                    placeholder="أدخل رقم الشارة"
                    className="police-input"
                    value={newUserBadge}
                    onChange={(e) => setNewUserBadge(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button className="police-button" onClick={handleCreateUser}>
                إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="بحث عن مستخدم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="police-input pr-10"
        />
      </div>
      
      <div className="border border-border/50 rounded-md overflow-hidden">
        <table className="police-table">
          <thead>
            <tr>
              <th className="w-1/6">الاسم</th>
              <th className="w-1/4">البريد الإلكتروني</th>
              <th className="w-1/6">رقم الشارة</th>
              <th className="w-1/6">الدور</th>
              <th className="w-1/6">تاريخ الإنشاء</th>
              <th className="w-1/6">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="cursor-pointer">
                <td className="font-medium">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.badge_number}</td>
                <td>{getUserRoleBadge(user.role)}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-police-red hover:text-police-red/80"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  لا توجد نتائج مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">تعديل بيانات المستخدم</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">الاسم الكامل</Label>
                <Input
                  id="edit-name"
                  className="police-input"
                  defaultValue={selectedUser.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  className="police-input"
                  defaultValue={selectedUser.email}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">الدور</Label>
                  <Select defaultValue={selectedUser.role}>
                    <SelectTrigger id="edit-role" className="police-input">
                      <SelectValue placeholder={translateRole(selectedUser.role)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مسؤول النظام</SelectItem>
                      <SelectItem value="officer">ضابط</SelectItem>
                      <SelectItem value="dispatch">موظف اتصالات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-badge">رقم الشارة</Label>
                  <Input
                    id="edit-badge"
                    className="police-input"
                    defaultValue={selectedUser.badge_number}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">كلمة المرور (اتركها فارغة للإبقاء عليها)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="police-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button className="police-button" onClick={handleEditUser}>
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete User Dialog */}
      {selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">حذف المستخدم</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center">
                هل أنت متأكد من أنك تريد حذف المستخدم <span className="font-bold">{selectedUser.name}</span>؟
              </p>
              <p className="text-center text-muted-foreground mt-2">
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                تأكيد الحذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPage;
