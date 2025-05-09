import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  ClipboardList,
  Calendar,
  MapPin,
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
import { Citation } from '@/types';

const CitationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // New citation form state
  const [newCitation, setNewCitation] = useState({
    citizen_id: '',
    violation: '',
    fine_amount: 0,
    date: new Date().toISOString().split('T')[0],
    location: '',
    paid: false
  });
  
  // Edit citation form state
  const [editCitation, setEditCitation] = useState({
    id: '',
    citizen_id: '',
    violation: '',
    fine_amount: 0,
    date: '',
    location: '',
    paid: false
  });

  // Fetch citations and citizens from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch citations
        const { data: citationsData, error: citationsError } = await supabase
          .from('citations')
          .select(`
            *,
            citizens (first_name, last_name)
          `)
          .order('created_at', { ascending: false });
          
        if (citationsError) throw citationsError;
        
        // Separately fetch officer names from profiles
        const officerIds = citationsData.map((citation: any) => citation.officer_id);
        const uniqueOfficerIds = [...new Set(officerIds)];
        
        const { data: officersData, error: officersError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueOfficerIds);
          
        if (officersError) throw officersError;
        
        // Create a map of officer IDs to names
        const officerMap = new Map();
        officersData?.forEach((officer: any) => {
          officerMap.set(officer.id, officer.name);
        });
        
        // Transform data to match Citation type
        const transformedCitations: Citation[] = citationsData.map((c: any) => ({
          id: c.id,
          citizen_id: c.citizen_id,
          violation: c.violation,
          fine_amount: c.fine_amount,
          date: c.date,
          location: c.location || '',
          officer_id: c.officer_id,
          officer_name: officerMap.get(c.officer_id) || 'ضابط غير معروف',
          paid: c.paid || false,
          created_at: c.created_at
        }));
        
        setCitations(transformedCitations);
        
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

  // Filter citations based on search query
  const filteredCitations = searchQuery
    ? citations.filter(citation => 
        citation.violation.includes(searchQuery) ||
        citation.location.includes(searchQuery))
    : citations;

  const handleAddCitation = async () => {
    // Validate input
    if (!newCitation.citizen_id) {
      toast.error("الرجاء اختيار مواطن");
      return;
    }

    if (!newCitation.violation) {
      toast.error("الرجاء إدخال نوع المخالفة");
      return;
    }
    
    if (newCitation.fine_amount <= 0) {
      toast.error("الرجاء إدخال قيمة الغرامة");
      return;
    }
    
    try {
      // Add citation to Supabase
      const { data, error } = await supabase
        .from('citations')
        .insert({
          citizen_id: newCitation.citizen_id,
          violation: newCitation.violation,
          fine_amount: newCitation.fine_amount,
          date: newCitation.date,
          location: newCitation.location,
          paid: newCitation.paid,
          officer_id: user?.id || '00000000-0000-0000-0000-000000000000'
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add to local state with proper officer name
        const newCitationData: Citation = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          violation: data[0].violation,
          fine_amount: data[0].fine_amount,
          date: data[0].date,
          location: data[0].location || '',
          officer_id: data[0].officer_id,
          officer_name: user?.name || 'ضابط غير معروف',
          paid: data[0].paid || false,
          created_at: data[0].created_at
        };
        
        setCitations([newCitationData, ...citations]);
        
        // Create notification about the new citation
        const citizen = citizens.find(c => c.id === newCitation.citizen_id);
        if (citizen) {
          await supabase.from('notifications').insert({
            title: 'مخالفة جديدة',
            description: `تم تسجيل مخالفة جديدة بحق ${citizen.name}: ${newCitation.violation}`,
            read: false,
            type: 'info',
            created_by: user?.id,
            related_to: data[0].id
          });
        }
      }
      
      setIsAddDialogOpen(false);
      
      // Reset form
      setNewCitation({
        citizen_id: '',
        violation: '',
        fine_amount: 0,
        date: new Date().toISOString().split('T')[0],
        location: '',
        paid: false
      });
      
      toast.success("تم إضافة المخالفة بنجاح");
    } catch (error) {
      console.error('Error adding citation:', error);
      toast.error("فشل في إضافة المخالفة");
    }
  };
  
  const handleEditClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setEditCitation({
      id: citation.id,
      citizen_id: citation.citizen_id,
      violation: citation.violation,
      fine_amount: citation.fine_amount,
      date: citation.date,
      location: citation.location,
      paid: citation.paid
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditCitation = async () => {
    try {
      const { error } = await supabase
        .from('citations')
        .update({
          violation: editCitation.violation,
          fine_amount: editCitation.fine_amount,
          date: editCitation.date,
          location: editCitation.location,
          paid: editCitation.paid
        })
        .eq('id', editCitation.id);
      
      if (error) throw error;
      
      // Update in local state
      setCitations(citations.map(c => {
        if (c.id === editCitation.id) {
          return {
            ...c,
            violation: editCitation.violation,
            fine_amount: editCitation.fine_amount,
            date: editCitation.date,
            location: editCitation.location,
            paid: editCitation.paid
          };
        }
        return c;
      }));
      
      setIsEditDialogOpen(false);
      toast.success("تم تحديث المخالفة بنجاح");
      
      // Add notification about updating the citation's payment status
      if (selectedCitation && selectedCitation.paid !== editCitation.paid) {
        const citizen = citizens.find(c => c.id === editCitation.citizen_id);
        if (citizen) {
          await supabase.from('notifications').insert({
            title: 'تحديث حالة الدفع',
            description: `تم ${editCitation.paid ? 'تسديد' : 'إلغاء تسديد'} المخالفة المسجلة بحق ${citizen.name}`,
            read: false,
            type: editCitation.paid ? 'success' : 'warning',
            created_by: user?.id,
            related_to: editCitation.id
          });
        }
      }
    } catch (error) {
      console.error('Error updating citation:', error);
      toast.error("فشل في تحديث المخالفة");
    }
  };
  
  const handleDeleteCitation = async () => {
    if (!selectedCitation) return;
    
    try {
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', selectedCitation.id);
      
      if (error) throw error;
      
      // Remove from local state
      setCitations(citations.filter(c => c.id !== selectedCitation.id));
      
      setIsDeleteDialogOpen(false);
      toast.success("تم حذف المخالفة بنجاح");
      
      // Add notification about deleting the citation
      const citizen = citizens.find(c => c.id === selectedCitation.citizen_id);
      if (citizen) {
        await supabase.from('notifications').insert({
          title: 'حذف مخالفة',
          description: `تم حذف المخالفة المسجلة بحق ${citizen.name}`,
          read: false,
          type: 'error',
          created_by: user?.id
        });
      }
    } catch (error) {
      console.error('Error deleting citation:', error);
      toast.error("فشل في حذف المخالفة");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ClipboardList className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">المخالفات</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مخالفة
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث في المخالفات..."
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
              <th>المخالفة</th>
              <th>الغرامة</th>
              <th>التاريخ</th>
              <th>الموقع</th>
              <th>الضابط المسؤول</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-muted-foreground">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredCitations.length > 0 ? (
              filteredCitations.map((citation) => (
                <tr key={citation.id}>
                  <td className="font-medium">
                    {citizens.find(c => c.id === citation.citizen_id)?.name || 'مواطن غير معروف'}
                  </td>
                  <td>{citation.violation}</td>
                  <td>{citation.fine_amount} دينار عراقي</td>
                  <td>{formatDate(citation.date)}</td>
                  <td>{citation.location || '-'}</td>
                  <td>{citation.officer_name}</td>
                  <td>
                    {citation.paid ? (
                      <Badge className="badge-green">مدفوعة</Badge>
                    ) : (
                      <Badge className="badge-red">غير مدفوعة</Badge>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(citation)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(citation)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-muted-foreground">
                  لا توجد مخالفات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Citation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة مخالفة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن *</Label>
              <Select 
                value={newCitation.citizen_id} 
                onValueChange={(value) => setNewCitation({...newCitation, citizen_id: value})}
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
            
            <div className="space-y-2">
              <Label htmlFor="violation">نوع المخالفة *</Label>
              <Input
                id="violation"
                placeholder="أدخل نوع المخالفة..."
                value={newCitation.violation}
                onChange={(e) => setNewCitation({...newCitation, violation: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fineAmount">مبلغ الغرامة (دينار عراقي) *</Label>
                <Input
                  id="fineAmount"
                  type="number"
                  placeholder="أدخل مبلغ الغرامة..."
                  value={newCitation.fine_amount}
                  onChange={(e) => setNewCitation({...newCitation, fine_amount: parseFloat(e.target.value)})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">تاريخ المخالفة *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={newCitation.date}
                    onChange={(e) => setNewCitation({...newCitation, date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">موقع المخالفة</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="أدخل موقع المخالفة..."
                  value={newCitation.location}
                  onChange={(e) => setNewCitation({...newCitation, location: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="paid"
                checked={newCitation.paid}
                onChange={(e) => setNewCitation({...newCitation, paid: e.target.checked})}
                className="h-4 w-4"
              />
              <Label htmlFor="paid" className="text-sm font-normal">المخالفة مدفوعة</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddCitation}>
              إضافة المخالفة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Citation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">تعديل المخالفة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editViolation">نوع المخالفة *</Label>
              <Input
                id="editViolation"
                placeholder="أدخل نوع المخالفة..."
                value={editCitation.violation}
                onChange={(e) => setEditCitation({...editCitation, violation: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFineAmount">مبلغ الغرامة (دينار عراقي) *</Label>
                <Input
                  id="editFineAmount"
                  type="number"
                  placeholder="أدخل مبلغ الغرامة..."
                  value={editCitation.fine_amount}
                  onChange={(e) => setEditCitation({...editCitation, fine_amount: parseFloat(e.target.value)})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editDate">تاريخ المخالفة *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="editDate"
                    type="date"
                    value={editCitation.date}
                    onChange={(e) => setEditCitation({...editCitation, date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editLocation">موقع المخالفة</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foregroun" />
                <Input
                  id="editLocation"
                  placeholder="أدخل موقع المخالفة..."
                  value={editCitation.location}
                  onChange={(e) => setEditCitation({...editCitation, location: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="editPaid"
                checked={editCitation.paid}
                onChange={(e) => setEditCitation({...editCitation, paid: e.target.checked})}
                className="h-4 w-4"
              />
              <Label htmlFor="editPaid" className="text-sm font-normal">المخالفة مدفوعة</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleEditCitation}>
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
              هل أنت متأكد من رغبتك في حذف المخالفة؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCitation} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CitationsPage;
