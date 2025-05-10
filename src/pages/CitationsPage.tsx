
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  FileText,
  Filter,
  Edit,
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
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types';

const CitationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for adding/editing citations
  const [formData, setFormData] = useState({
    citizenId: '',
    violation: '',
    fineAmount: 100,
    date: new Date(),
    location: '',
    paid: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // Fetch citations from Supabase
  useEffect(() => {
    const fetchCitationsAndCitizens = async () => {
      setIsLoading(true);
      try {
        // Fetch citizens for dropdown
        const { data: citizensData, error: citizensError } = await supabase
          .from('citizens')
          .select('id, first_name, last_name');
          
        if (citizensError) throw citizensError;
        
        setCitizens(citizensData || []);
        
        // Create a map of citizen IDs to names
        const citizenMap = new Map();
        if (citizensData) {
          citizensData.forEach((citizen: any) => {
            citizenMap.set(citizen.id, `${citizen.first_name} ${citizen.last_name}`);
          });
        }
        
        // Fetch citations
        const { data: citationsData, error: citationsError } = await supabase
          .from('citations')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (citationsError) throw citationsError;
        
        if (citationsData) {
          // Fetch officer names
          const officerIds = citationsData.map((citation: any) => citation.officer_id).filter(Boolean);
          const uniqueOfficerIds = [...new Set(officerIds)];
          
          let officerMap = new Map();
          if (uniqueOfficerIds.length > 0) {
            try {
              const { data: officersData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', uniqueOfficerIds);
                
              if (officersData) {
                officersData.forEach((officer: any) => {
                  officerMap.set(officer.id, officer.name);
                });
              }
            } catch (officerError) {
              console.error('Error fetching officer data:', officerError);
              // Continue with available data
            }
          }
          
          // Transform data
          const transformedCitations: Citation[] = citationsData.map((citation: any) => ({
            id: citation.id,
            citizen_id: citation.citizen_id,
            citizen_name: citizenMap.get(citation.citizen_id) || 'مواطن غير معروف',
            violation: citation.violation,
            fine_amount: citation.fine_amount,
            date: citation.date,
            location: citation.location || '',
            officer_id: citation.officer_id,
            officer_name: officerMap.get(citation.officer_id) || 'ضابط غير معروف',
            paid: citation.paid || false,
            created_at: citation.created_at
          }));
          
          setCitations(transformedCitations);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('فشل في جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCitationsAndCitizens();
  }, []);

  // Filter citations based on search query and status filter
  const filteredCitations = citations
    .filter(citation => 
      searchQuery === '' || 
      citation.violation.includes(searchQuery) ||
      citation.citizen_name.includes(searchQuery) ||
      citation.location.includes(searchQuery)
    )
    .filter(citation => 
      statusFilter === 'all' || 
      (statusFilter === 'paid' && citation.paid) || 
      (statusFilter === 'unpaid' && !citation.paid)
    );

  const handleAddCitation = async () => {
    // Validation
    if (!formData.citizenId) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!formData.violation) {
      toast.error("الرجاء إدخال نوع المخالفة");
      return;
    }

    if (!formData.fineAmount) {
      toast.error("الرجاء إدخال مبلغ الغرامة");
      return;
    }

    if (!formData.date) {
      toast.error("الرجاء تحديد تاريخ المخالفة");
      return;
    }

    if (!formData.location) {
      toast.error("الرجاء إدخال موقع المخالفة");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      // Add citation to Supabase
      const { data, error } = await supabase
        .from('citations')
        .insert({
          citizen_id: formData.citizenId,
          violation: formData.violation,
          fine_amount: formData.fineAmount,
          date: formattedDate,
          location: formData.location,
          paid: formData.paid,
          officer_id: user?.id
        })
        .select();
      
      if (error) throw error;
      
      const citizenName = citizens.find(c => c.id === formData.citizenId)
        ? `${citizens.find(c => c.id === formData.citizenId).first_name} ${citizens.find(c => c.id === formData.citizenId).last_name}`
        : 'مواطن غير معروف';
      
      // Add to local state
      const newCitation: Citation = {
        id: data[0].id,
        citizen_id: formData.citizenId,
        citizen_name: citizenName,
        violation: formData.violation,
        fine_amount: formData.fineAmount,
        date: formattedDate,
        location: formData.location,
        officer_id: user?.id || '',
        officer_name: user?.name || '',
        paid: formData.paid,
        created_at: data[0].created_at
      };
      
      setCitations([newCitation, ...citations]);
      
      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);
      
      // Add notification
      await supabase.from('notifications').insert({
        title: 'تسجيل مخالفة جديدة',
        description: `تم تسجيل مخالفة جديدة بحق المواطن ${citizenName}`,
        read: false,
        type: 'info',
        created_by: user?.id,
        related_to: data[0].id
      });
      
      toast.success("تمت إضافة المخالفة بنجاح");
    } catch (error) {
      console.error('Error adding citation:', error);
      toast.error("فشل في إضافة المخالفة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setFormData({
      citizenId: citation.citizen_id,
      violation: citation.violation,
      fineAmount: citation.fine_amount,
      date: new Date(citation.date),
      location: citation.location || '',
      paid: citation.paid
    });
    setIsEditDialogOpen(true);
  };
  
  const handleEditCitation = async () => {
    if (!selectedCitation) return;
    
    // Validation (same as add)
    if (!formData.violation) {
      toast.error("الرجاء إدخال نوع المخالفة");
      return;
    }

    if (!formData.fineAmount) {
      toast.error("الرجاء إدخال مبلغ الغرامة");
      return;
    }

    if (!formData.date) {
      toast.error("الرجاء تحديد تاريخ المخالفة");
      return;
    }

    if (!formData.location) {
      toast.error("الرجاء إدخال موقع المخالفة");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      // Update citation in Supabase
      const { error } = await supabase
        .from('citations')
        .update({
          violation: formData.violation,
          fine_amount: formData.fineAmount,
          date: formattedDate,
          location: formData.location,
          paid: formData.paid
        })
        .eq('id', selectedCitation.id);
      
      if (error) throw error;
      
      // Update in local state
      setCitations(citations.map(c => {
        if (c.id === selectedCitation.id) {
          return {
            ...c,
            violation: formData.violation,
            fine_amount: formData.fineAmount,
            date: formattedDate,
            location: formData.location,
            paid: formData.paid
          };
        }
        return c;
      }));
      
      // Reset form and close dialog
      resetForm();
      setIsEditDialogOpen(false);
      
      // Add notification
      await supabase.from('notifications').insert({
        title: 'تحديث مخالفة',
        description: `تم تحديث مخالفة المواطن ${selectedCitation.citizen_name}`,
        read: false,
        type: 'info',
        created_by: user?.id,
        related_to: selectedCitation.id
      });
      
      toast.success("تم تحديث المخالفة بنجاح");
    } catch (error) {
      console.error('Error updating citation:', error);
      toast.error("فشل في تحديث المخالفة");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteCitation = async () => {
    if (!selectedCitation) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', selectedCitation.id);
      
      if (error) throw error;
      
      // Remove from local state
      setCitations(citations.filter(c => c.id !== selectedCitation.id));
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      
      // Add notification
      await supabase.from('notifications').insert({
        title: 'حذف مخالفة',
        description: `تم حذف مخالفة المواطن ${selectedCitation.citizen_name}`,
        read: false,
        type: 'error',
        created_by: user?.id
      });
      
      toast.success("تم حذف المخالفة بنجاح");
    } catch (error) {
      console.error('Error deleting citation:', error);
      toast.error("فشل في حذف المخالفة");
    }
  };
  
  const handleSetPaidClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setIsPaidDialogOpen(true);
  };
  
  const handleSetPaid = async () => {
    if (!selectedCitation) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('citations')
        .update({ paid: true })
        .eq('id', selectedCitation.id);
      
      if (error) throw error;
      
      // Update in local state
      setCitations(citations.map(c => {
        if (c.id === selectedCitation.id) {
          return { ...c, paid: true };
        }
        return c;
      }));
      
      // Close dialog
      setIsPaidDialogOpen(false);
      
      // Add notification
      await supabase.from('notifications').insert({
        title: 'تسديد مخالفة',
        description: `تم تسديد مخالفة المواطن ${selectedCitation.citizen_name}`,
        read: false,
        type: 'success',
        created_by: user?.id,
        related_to: selectedCitation.id
      });
      
      toast.success("تم تسديد المخالفة بنجاح");
    } catch (error) {
      console.error('Error updating paid status:', error);
      toast.error("فشل في تحديث حالة الدفع");
    }
  };
  
  const resetForm = () => {
    setFormData({
      citizenId: '',
      violation: '',
      fineAmount: 100,
      date: new Date(),
      location: '',
      paid: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">المخالفات</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مخالفة
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="البحث عن مخالفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="police-input pr-10"
            />
          </div>
        </div>
        
        <div className="relative">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="police-input">
              <div className="flex items-center">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue placeholder="الحالة" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المخالفات</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="unpaid">غير مدفوعة</SelectItem>
            </SelectContent>
          </Select>
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
            ) : filteredCitations.length > 0 ? (
              filteredCitations.map((citation) => (
                <tr key={citation.id}>
                  <td>{citation.citizen_name}</td>
                  <td>{citation.violation}</td>
                  <td>{citation.fine_amount} ريال</td>
                  <td>{formatDate(citation.date)}</td>
                  <td>{citation.location || 'غير محدد'}</td>
                  <td>
                    {citation.paid ? (
                      <Badge className="badge-green">تم الدفع</Badge>
                    ) : (
                      <Badge className="badge-red">لم يتم الدفع</Badge>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      {!citation.paid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPaidClick(citation)}
                          title="تسديد المخالفة"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(citation)}
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(citation)}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  لا توجد مخالفات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Citation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(value) => {
        if (!value) resetForm();
        setIsAddDialogOpen(value);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة مخالفة جديدة</DialogTitle>
            <DialogDescription className="text-center">أدخل معلومات المخالفة</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن *</Label>
              <Select 
                value={formData.citizenId} 
                onValueChange={(value) => setFormData({...formData, citizenId: value})}
              >
                <SelectTrigger id="citizen" className="police-input">
                  <SelectValue placeholder="اختر المواطن" />
                </SelectTrigger>
                <SelectContent>
                  {citizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      {citizen.first_name} {citizen.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violation">نوع المخالفة *</Label>
              <Input
                id="violation"
                placeholder="مثال: تجاوز السرعة المحددة"
                value={formData.violation}
                onChange={(e) => setFormData({...formData, violation: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fineAmount">مبلغ الغرامة (ريال) *</Label>
                <Input
                  id="fineAmount"
                  type="number"
                  min={0}
                  value={formData.fineAmount}
                  onChange={(e) => setFormData({...formData, fineAmount: parseFloat(e.target.value) || 0})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>تاريخ المخالفة *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="police-input w-full justify-start text-right"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: ar }) : <span>اختر التاريخ</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({...formData, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">موقع المخالفة *</Label>
              <Input
                id="location"
                placeholder="مثال: طريق الملك فهد، الرياض"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="paid"
                checked={formData.paid}
                onChange={(e) => setFormData({...formData, paid: e.target.checked})}
                className="h-4 w-4 rounded border-border text-police-blue focus:ring-police-blue"
              />
              <Label htmlFor="paid" className="cursor-pointer">تم الدفع</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleAddCitation} className="police-button" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإضافة..." : "إضافة المخالفة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Citation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(value) => {
        if (!value) resetForm();
        setIsEditDialogOpen(value);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">تعديل مخالفة</DialogTitle>
            <DialogDescription className="text-center">تعديل معلومات المخالفة</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن</Label>
              <Input
                id="citizen"
                value={selectedCitation?.citizen_name || ''}
                disabled
                className="police-input bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violation">نوع المخالفة *</Label>
              <Input
                id="violation"
                placeholder="مثال: تجاوز السرعة المحددة"
                value={formData.violation}
                onChange={(e) => setFormData({...formData, violation: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fineAmount">مبلغ الغرامة (ريال) *</Label>
                <Input
                  id="fineAmount"
                  type="number"
                  min={0}
                  value={formData.fineAmount}
                  onChange={(e) => setFormData({...formData, fineAmount: parseFloat(e.target.value) || 0})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>تاريخ المخالفة *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="police-input w-full justify-start text-right"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP', { locale: ar }) : <span>اختر التاريخ</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({...formData, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">موقع المخالفة *</Label>
              <Input
                id="location"
                placeholder="مثال: طريق الملك فهد، الرياض"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="checkbox"
                id="edit-paid"
                checked={formData.paid}
                onChange={(e) => setFormData({...formData, paid: e.target.checked})}
                className="h-4 w-4 rounded border-border text-police-blue focus:ring-police-blue"
              />
              <Label htmlFor="edit-paid" className="cursor-pointer">تم الدفع</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleEditCitation} className="police-button" disabled={isSubmitting}>
              {isSubmitting ? "جاري التحديث..." : "تحديث المخالفة"}
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
              هل أنت متأكد من رغبتك في حذف هذه المخالفة؟ هذا الإجراء لا يمكن التراجع عنه.
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
      
      {/* Set Paid Confirmation Dialog */}
      <AlertDialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تسديد المخالفة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تسديد هذه المخالفة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetPaid} className="bg-green-600 hover:bg-green-700">
              تأكيد التسديد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CitationsPage;
