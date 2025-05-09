
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Shield, Loader2 } from "lucide-react";
import { User } from "@/types";

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "officer" as "admin" | "officer" | "dispatch",
    badge_number: "",
  });
  const [editUser, setEditUser] = useState({
    id: "",
    email: "",
    name: "",
    role: "officer" as "admin" | "officer" | "dispatch",
    badge_number: "",
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("غير مصرح بالوصول لهذه الصفحة");
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth users (requires special RPC function to be set up in Supabase)
      const { data: authUsers, error: authError } = await supabase
        .rpc('get_users');
        
      if (authError) {
        console.error("Auth query error:", authError);
        // Continue with just profiles data
      }

      // Map auth users email to profiles if available
      const userProfiles: User[] = profiles.map((profile: any) => {
        // Try to find matching auth user
        const authUser = authUsers?.find((au: any) => au.id === profile.id);
        
        return {
          id: profile.id,
          email: authUser?.email || profile.id,
          name: profile.name,
          role: profile.role,
          badge_number: profile.badge_number || "N/A",
          created_at: profile.created_at,
        };
      });

      setUsers(userProfiles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل في جلب بيانات المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const handleAddUser = async () => {
    try {
      setIsCreatingUser(true);

      // Validate
      if (!newUser.email || !newUser.name || !newUser.password) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      if (newUser.password.length < 6) {
        toast.error("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
        return;
      }

      // Create user via Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role,
            badge_number: newUser.badge_number || undefined
          },
        }
      });

      if (error) throw error;

      // Close dialog and reset form
      setIsAddDialogOpen(false);
      setNewUser({
        email: "",
        name: "",
        password: "",
        role: "officer",
        badge_number: "",
      });

      toast.success("تم إنشاء المستخدم بنجاح");
      
      // Wait a moment for the trigger to create the profile
      setTimeout(() => {
        fetchUsers();
      }, 1000);
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(`فشل إضافة المستخدم: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };
  
  const handleEditUser = async () => {
    try {
      setIsEditingUser(true);
      
      if (!editUser.name) {
        toast.error("يرجى إدخال اسم المستخدم");
        return;
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: editUser.name,
          role: editUser.role,
          badge_number: editUser.badge_number
        })
        .eq("id", editUser.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setUsers(users.map(u => 
        u.id === editUser.id
          ? { ...u, name: editUser.name, role: editUser.role, badge_number: editUser.badge_number }
          : u
      ));
      
      setIsEditUserDialogOpen(false);
      toast.success("تم تحديث المستخدم بنجاح");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`فشل تحديث المستخدم: ${error.message}`);
    } finally {
      setIsEditingUser(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsDeletingUser(true);
      
      // Delete user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedUser.id);
      
      if (profileError) throw profileError;
      
      // Can't delete from auth.users table directly, but we can update the local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      setIsDeleteUserDialogOpen(false);
      toast.success("تم حذف المستخدم بنجاح");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`فشل حذف المستخدم: ${error.message}`);
    } finally {
      setIsDeletingUser(false);
    }
  };
  
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "officer" | "dispatch",
      badge_number: user.badge_number,
    });
    setIsEditUserDialogOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserDialogOpen(true);
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Users className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          إضافة مستخدم جديد
        </Button>
      </div>

      <div className="police-card p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-police-blue" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">رقم الشارة</TableHead>
                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell dir="ltr" className="font-mono">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {user.role === "admin" && <Shield className="h-4 w-4 ml-1 text-police-blue" />}
                      {user.role === "admin" ? "مسؤول النظام" : 
                       user.role === "dispatch" ? "مشغل اتصالات" : "ضابط"}
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="font-mono">{user.badge_number}</TableCell>
                  <TableCell dir="ltr">
                    {new Date(user.created_at).toLocaleDateString("ar-SA")}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                        تعديل
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteClick(user)}>
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لم يتم العثور على مستخدمين
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                placeholder="أدخل اسم المستخدم"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                dir="ltr"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="كلمة المرور"
                dir="ltr"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge_number">رقم الشارة</Label>
              <Input
                id="badge_number"
                placeholder="أدخل رقم الشارة"
                dir="ltr"
                value={newUser.badge_number}
                onChange={(e) => setNewUser({ ...newUser, badge_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: "admin" | "officer" | "dispatch") => 
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مسؤول النظام</SelectItem>
                  <SelectItem value="officer">ضابط</SelectItem>
                  <SelectItem value="dispatch">مشغل اتصالات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              className="police-button"
              onClick={handleAddUser} 
              disabled={isCreatingUser}
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء المستخدم'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">الاسم</Label>
              <Input
                id="edit-name"
                placeholder="أدخل اسم المستخدم"
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="example@domain.com"
                dir="ltr"
                value={editUser.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-badge_number">رقم الشارة</Label>
              <Input
                id="edit-badge_number"
                placeholder="أدخل رقم الشارة"
                dir="ltr"
                value={editUser.badge_number}
                onChange={(e) => setEditUser({ ...editUser, badge_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">الدور</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: "admin" | "officer" | "dispatch") => 
                  setEditUser({ ...editUser, role: value })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مسؤول النظام</SelectItem>
                  <SelectItem value="officer">ضابط</SelectItem>
                  <SelectItem value="dispatch">مشغل اتصالات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              className="police-button"
              onClick={handleEditUser} 
              disabled={isEditingUser}
            >
              {isEditingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد حذف المستخدم</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center">
              هل أنت متأكد من رغبتك في حذف المستخدم؟
              <br />
              <span className="font-bold">{selectedUser?.name}</span>
            </p>
            <p className="text-center text-red-500 mt-2">
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteUserDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser} 
              disabled={isDeletingUser}
            >
              {isDeletingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف المستخدم'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
