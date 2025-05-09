
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  AlertTriangle,
  Calendar,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Warrant } from '@/types';

const WarrantsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedWarrant, setSelectedWarrant] = useState<Warrant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // New warrant form state
  const [newWarrant, setNewWarrant] = useState({
    citizen_id: '',
    reason: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    status: 'active' as 'active' | 'executed' | 'expired'
  });
  
  // Edit warrant form state
  const [editWarrant, setEditWarrant] = useState({
    id: '',
    citizen_id: '',
    reason: '',
    issue_date: '',
    expiry_date: '',
    status: 'active' as 'active' | 'executed' | 'expired'
  });

  // Fetch warrants and citizens from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch warrants with citizen information
        const { data: warrantsData, error: warrantsError } = await supabase
          .from('warrants')
          .select(`
            *,
            citizens (first_name, last_name),
            profiles:issuing_officer_id (name)
          `);
          
        if (warrantsError) throw warrantsError;
        
        // Transform data to match Warrant type
        const transformedWarrants: Warrant[] = warrantsData.map((w: any) => ({
          id: w.id,
          citizen_id: w.citizen_id,
          citizen_name: w.citizens ? `${w.citizens.first_name} ${w.citizens.last_name}` : 'مواطن غير معروف',
          reason: w.reason,
          status: w.status || 'active',
          issue_date: w.issue_date,
          expiry_date: w.expiry_date,
          issuing_officer_id: w.issuing_officer_id,
          issuing_officer_name: w.profiles?.name || 'ضابط غير معروف',
          created_at: w.created_at
        }));
        
        setWarrants(transformedWarrants);
        
        // Fetch citizens for dropdown
        const { data: citizensData, error: citizensError } = await supabase
          .from('citizens')
          .select('id, first_name, last_name');
          
        if (citizensError) throw citizensError;
        
        setCitizens(citizensData.map((c: any) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('فشل في جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter warrants based on search query
  const filteredWarrants = searchQuery
    ? warrants.filter(warrant => 
        warrant.citizen_name.includes(searchQuery) ||
        warrant.reason.includes(searchQuery))
    : warrants;

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="badge-red">نشط</Badge>;
    } else if (status === 'expired') {
      return <Badge className="badge-gray">منتهي</Badge>;
    } else if (status === 'executed') {
      return <Badge className="badge-green">تم تنفيذه</Badge>;
    } else {
      return <Badge>{status}</Badge>;
    }
  };

  const handleAddWarrant = async () => {
    // Validate input
    if (!newWarrant.citizen_id) {
      toast.error("الرجاء اختيار مواطن");
      return;
    }

    if (!newWarrant.reason) {
      toast.error("الرجاء إدخال سبب أمر التوقيف");
      return;
    }
    
    try {
      // Add warrant to Supabase
      const { data, error } = await supabase
        .from('warrants')
        .insert({
          citizen_id: newWarrant.citizen_id,
          reason: newWarrant.reason,
          issue_date: newWarrant.issue_date,
          expiry_date: newWarrant.expiry_date,
          status: newWarrant.status,
          issuing_officer_id: user?.id || '00000000-0000-0000-0000-000000000000'
        })
        .select(`
          *,
          citizens (first_name, last_name),
          profiles:issuing_officer_id (name)
        `);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add to local state
        const newWarrantData: Warrant = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          citizen_name: data[0].citizens ? `${data[0].citizens.first_name} ${data[0].citizens.last_name}` : 'مواطن غير معروف',
          reason: data[0].reason,
          status: data[0].status || 'active',
          issue_date: data[0].issue_date,
          expiry_date: data[0].expiry_date,
          issuing_officer_id: data[0].issuing_officer_id,
          issuing_officer_name: data[0].profiles?.name || 'ضابط غير معروف',
          created_at: data[0].created_at
        };
        
        setWarrants([newWarrantData, ...warrants]);
      }
      
      setIsAddDialogOpen(false);
      
      // Reset form
      setNewWarrant({
        citizen_id: '',
        reason: '',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active' as 'active' | 'executed' | 'expired'
      });
      
      toast.success("تم إضافة أمر التوقيف بنجاح");
    } catch (error) {
      console.error('Error adding warrant:', error);
      toast.error("فشل في إضافة أمر التوقيف");
    }
  };
  
  const handleEditClick = (warrant: Warrant) => {
    setSelectedWarrant(warrant);
    setEditWarrant({
      id: warrant.id,
      citizen_id: warrant.citizen_id,
      reason: warrant.reason,
      issue_date: warrant.issue_date,
      expiry_date: warrant.expiry_date,
      status: warrant.status as 'active' | 'executed' | 'expired'
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (warrant: Warrant) => {
    setSelectedWarrant(warrant);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditWarrant = async () => {
    try {
      const { error } = await supabase
        .from('warrants')
        .update({
          reason: editWarrant.reason,
          issue_date: editWarrant.issue_date,
          expiry_date: editWarrant.expiry_date,
          status: editWarrant.status
        })
        .eq('id', editWarrant.id);
      
      if (error) throw error;
      
      // Update in local state
      setWarrants(warrants.map(w => {
        if (w.id === editWarrant.id) {
          return {
            ...w,
            reason: editWarrant.reason,
            issue_date: editWarrant.issue_date,
            expiry_date: editWarrant.expiry_date,
            status: editWarrant.status
          };
        }
        return w;
      }));
      
      setIsEditDialogOpen(false);
      toast.success("تم تحديث أمر التوقيف بنجاح");
    } catch (error) {
      console.error('Error updating warrant:', error);
      toast.error("فشل في تحديث أمر التوقيف");
    }
  };
  
  const handleDeleteWarrant = async () => {
    if (!selectedWarrant) return;
    
    try {
      const { error } = await supabase
        .from('warrants')
        .delete()
        .eq('id', selectedWarrant.id);
      
      if (error) throw error;
      
      // Remove from local state
      setWarrants(warrants.filter(w => w.id !== selectedWarrant.id));
      
      setIsDeleteDialogOpen(false);
      toast.success("تم حذف أمر التوقيف بنجاح");
    } catch (error) {
      console.error('Error deleting warrant:', error);
      toast.error("فشل في حذف أمر التوقيف");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">أوامر التوقيف</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة أمر توقيف
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن أمر توقيف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="police-input pr-10"
          />
        </div>
      </div>
      
      <div className="border border-border/50 rounded-md overflow-hidden">
        <table className="police-table">
          <thead>
            <tr>
              <th>المواطن</th>
              <th>سبب أمر التوقيف</th>
              <th>تاريخ الإصدار</th>
              <th>تاريخ الانتهاء</th>
              <th>الضابط المسؤول</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredWarrants.length > 0 ? (
              filteredWarrants.map((warrant) => (
                <tr key={warrant.id}>
                  <td className="font-medium">{warrant.citizen_name}</td>
                  <td>{warrant.reason}</td>
                  <td>{formatDate(warrant.issue_date)}</td>
                  <td>{formatDate(warrant.expiry_date)}</td>
                  <td>{warrant.issuing_officer_name}</td>
                  <td>{getStatusBadge(warrant.status)}</td>
                  <td>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(warrant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(warrant)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  لا توجد أوامر توقيف مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Warrant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة أمر توقيف جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن *</Label>
              <Select 
                value={newWarrant.citizen_id} 
                onValueChange={(value) => setNewWarrant({...newWarrant, citizen_id: value})}
              >
                <SelectTrigger id="citizen" className="police-input">
                  <SelectValue placeholder="اختر المواطن" />
                </SelectTrigger>
                <SelectContent>
                  {citizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      {citizen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">تاريخ الإصدار *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="issueDate"
                    type="date"
                    value={newWarrant.issue_date}
                    onChange={(e) => setNewWarrant({...newWarrant, issue_date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiryDate">تاريخ الانتهاء *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newWarrant.expiry_date}
                    onChange={(e) => setNewWarrant({...newWarrant, expiry_date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">سبب أمر التوقيف *</Label>
              <Textarea
                id="reason"
                placeholder="أدخل سبب أمر التوقيف..."
                value={newWarrant.reason}
                onChange={(e) => setNewWarrant({...newWarrant, reason: e.target.value})}
                className="police-input min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select 
                value={newWarrant.status} 
                onValueChange={(value: 'active' | 'executed' | 'expired') => setNewWarrant({...newWarrant, status: value})}
              >
                <SelectTrigger id="status" className="police-input">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="executed">تم تنفيذه</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddWarrant}>
              إضافة أمر التوقيف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Warrant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">تعديل أمر التوقيف</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editIssueDate">تاريخ الإصدار *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="editIssueDate"
                    type="date"
                    value={editWarrant.issue_date}
                    onChange={(e) => setEditWarrant({...editWarrant, issue_date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editExpiryDate">تاريخ الانتهاء *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="editExpiryDate"
                    type="date"
                    value={editWarrant.expiry_date}
                    onChange={(e) => setEditWarrant({...editWarrant, expiry_date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editReason">سبب أمر التوقيف *</Label>
              <Textarea
                id="editReason"
                placeholder="أدخل سبب أمر التوقيف..."
                value={editWarrant.reason}
                onChange={(e) => setEditWarrant({...editWarrant, reason: e.target.value})}
                className="police-input min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editStatus">الحالة</Label>
              <Select 
                value={editWarrant.status} 
                onValueChange={(value: 'active' | 'executed' | 'expired') => setEditWarrant({...editWarrant, status: value})}
              >
                <SelectTrigger id="editStatus" className="police-input">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="executed">تم تنفيذه</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleEditWarrant}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف أمر التوقيف؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWarrant} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WarrantsPage;
