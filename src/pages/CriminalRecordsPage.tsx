
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  FileText,
  Filter,
  Edit,
  Trash2
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
import { CriminalRecord } from '@/types';

const CriminalRecordsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [criminalRecords, setCriminalRecords] = useState<CriminalRecord[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CriminalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for adding/editing records
  const [formData, setFormData] = useState({
    citizenId: '',
    offense: '',
    description: '',
    date: new Date(),
    status: 'active' as 'active' | 'completed' | 'dismissed'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // Fetch criminal records and citizens from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch citizens for dropdown
        const { data: citizensData, error: citizensError } = await supabase
          .from('citizens')
          .select('id, first_name, last_name');
          
        if (citizensError) throw citizensError;
        
        setCitizens(citizensData || []);
        
        // Fetch criminal records
        const { data: recordsData, error: recordsError } = await supabase
          .from('criminal_records')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (recordsError) throw recordsError;
        
        if (recordsData) {
          // Create a map of citizen IDs to names
          const citizenMap = new Map();
          if (citizensData) {
            citizensData.forEach((citizen: any) => {
              citizenMap.set(citizen.id, `${citizen.first_name} ${citizen.last_name}`);
            });
          }
          
          // Fetch officer names
          const officerIds = recordsData.map((record: any) => record.officer_id).filter(Boolean);
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
          const transformedRecords: CriminalRecord[] = recordsData.map((record: any) => ({
            id: record.id,
            citizen_id: record.citizen_id,
            offense: record.offense,
            description: record.description || '',
            date: record.date,
            officer_id: record.officer_id,
            officer_name: officerMap.get(record.officer_id) || 'ضابط غير معروف',
            status: record.status as 'active' | 'completed' | 'dismissed',
            created_at: record.created_at
          }));
          
          setCriminalRecords(transformedRecords);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('فشل في جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter records based on search query and status filter
  const filteredRecords = criminalRecords
    .filter(record => 
      searchQuery === '' || 
      record.offense.includes(searchQuery) ||
      (record.description && record.description.includes(searchQuery))
    )
    .filter(record => 
      statusFilter === 'all' || 
      record.status === statusFilter
    );

  const handleAddRecord = async () => {
    // Validation
    if (!formData.citizenId) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!formData.offense) {
      toast.error("الرجاء إدخال التهمة");
      return;
    }

    if (!formData.date) {
      toast.error("الرجاء تحديد تاريخ السجل");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      // Add record to Supabase
      const { data, error } = await supabase
        .from('criminal_records')
        .insert({
          citizen_id: formData.citizenId,
          offense: formData.offense,
          description: formData.description,
          date: formattedDate,
          officer_id: user?.id,
          status: formData.status
        })
        .select();
      
      if (error) throw error;
      
      // Find the citizen name
      const citizen = citizens.find(c => c.id === formData.citizenId);
      const citizenName = citizen ? `${citizen.first_name} ${citizen.last_name}` : 'مواطن غير معروف';
      
      // Add to local state
      const newRecord: CriminalRecord = {
        id: data[0].id,
        citizen_id: formData.citizenId,
        offense: formData.offense,
        description: formData.description,
        date: formattedDate,
        officer_id: user?.id || '',
        officer_name: user?.name || '',
        status: formData.status,
        created_at: data[0].created_at
      };
      
      setCriminalRecords([newRecord, ...criminalRecords]);
      
      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);
      
      // Add notification
      await supabase.from('notifications').insert({
        title: 'إضافة سجل جنائي',
        description: `تم إضافة سجل جنائي جديد للمواطن ${citizenName}: ${formData.offense}`,
        read: false,
        type: 'warning',
        created_by: user?.id,
        related_to: data[0].id
      });
      
      toast.success("تم إضافة السجل الجنائي بنجاح");
    } catch (error) {
      console.error('Error adding criminal record:', error);
      toast.error("فشل في إضافة السجل الجنائي");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (record: CriminalRecord) => {
    setSelectedRecord(record);
    setFormData({
      citizenId: record.citizen_id,
      offense: record.offense,
      description: record.description || '',
      date: new Date(record.date),
      status: record.status
    });
    setIsEditDialogOpen(true);
  };
  
  const handleEditRecord = async () => {
    if (!selectedRecord) return;
    
    // Validation
    if (!formData.offense) {
      toast.error("الرجاء إدخال التهمة");
      return;
    }

    if (!formData.date) {
      toast.error("الرجاء تحديد تاريخ السجل");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      // Update record in Supabase
      const { error } = await supabase
        .from('criminal_records')
        .update({
          offense: formData.offense,
          description: formData.description,
          date: formattedDate,
          status: formData.status
        })
        .eq('id', selectedRecord.id);
      
      if (error) throw error;
      
      // Update in local state
      setCriminalRecords(criminalRecords.map(record => {
        if (record.id === selectedRecord.id) {
          return {
            ...record,
            offense: formData.offense,
            description: formData.description,
            date: formattedDate,
            status: formData.status
          };
        }
        return record;
      }));
      
      // Reset form and close dialog
      resetForm();
      setIsEditDialogOpen(false);
      
      toast.success("تم تحديث السجل الجنائي بنجاح");
    } catch (error) {
      console.error('Error updating criminal record:', error);
      toast.error("فشل في تحديث السجل الجنائي");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (record: CriminalRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('criminal_records')
        .delete()
        .eq('id', selectedRecord.id);
      
      if (error) throw error;
      
      // Remove from local state
      setCriminalRecords(criminalRecords.filter(record => record.id !== selectedRecord.id));
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      
      toast.success("تم حذف السجل الجنائي بنجاح");
    } catch (error) {
      console.error('Error deleting criminal record:', error);
      toast.error("فشل في حذف السجل الجنائي");
    }
  };
  
  const resetForm = () => {
    setFormData({
      citizenId: '',
      offense: '',
      description: '',
      date: new Date(),
      status: 'active'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-blue">نشط</Badge>;
      case 'completed':
        return <Badge className="badge-green">مكتمل</Badge>;
      case 'dismissed':
        return <Badge className="badge-yellow">مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">السجلات الجنائية</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة سجل
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="البحث عن سجل جنائي..."
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
              <SelectItem value="all">جميع السجلات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="dismissed">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border border-border/50 rounded-md overflow-hidden">
        <table className="police-table">
          <thead>
            <tr>
              <th>المواطن</th>
              <th>التهمة</th>
              <th>الوصف</th>
              <th>التاريخ</th>
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
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                // Get citizen name
                const citizen = citizens.find(c => c.id === record.citizen_id);
                const citizenName = citizen ? `${citizen.first_name} ${citizen.last_name}` : 'مواطن غير معروف';
                
                return (
                  <tr key={record.id}>
                    <td>{citizenName}</td>
                    <td>{record.offense}</td>
                    <td className="max-w-[200px] truncate">
                      {record.description || 'لا يوجد وصف'}
                    </td>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.officer_name}</td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(record)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(record)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  لا توجد سجلات جنائية مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(value) => {
        if (!value) resetForm();
        setIsAddDialogOpen(value);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة سجل جنائي جديد</DialogTitle>
            <DialogDescription className="text-center">أدخل معلومات السجل الجنائي</DialogDescription>
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
              <Label htmlFor="offense">التهمة *</Label>
              <Input
                id="offense"
                placeholder="مثال: سرقة، اعتداء، مخالفة نظام المرور"
                value={formData.offense}
                onChange={(e) => setFormData({...formData, offense: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ السجل *</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="status">الحالة *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'completed' | 'dismissed'})}
                >
                  <SelectTrigger id="status" className="police-input">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="dismissed">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">وصف السجل</Label>
              <Textarea
                id="description"
                placeholder="أدخل وصف تفصيلي للسجل الجنائي هنا..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="police-input min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleAddRecord} className="police-button" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإضافة..." : "إضافة السجل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(value) => {
        if (!value) resetForm();
        setIsEditDialogOpen(value);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">تعديل سجل جنائي</DialogTitle>
            <DialogDescription className="text-center">تعديل معلومات السجل الجنائي</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن</Label>
              <Input
                id="citizen"
                value={citizens.find(c => c.id === formData.citizenId)
                  ? `${citizens.find(c => c.id === formData.citizenId).first_name} ${citizens.find(c => c.id === formData.citizenId).last_name}`
                  : 'مواطن غير معروف'}
                disabled
                className="police-input bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="offense">التهمة *</Label>
              <Input
                id="offense"
                placeholder="مثال: سرقة، اعتداء، مخالفة نظام المرور"
                value={formData.offense}
                onChange={(e) => setFormData({...formData, offense: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ السجل *</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="status">الحالة *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value as 'active' | 'completed' | 'dismissed'})}
                >
                  <SelectTrigger id="status" className="police-input">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="dismissed">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">وصف السجل</Label>
              <Textarea
                id="description"
                placeholder="أدخل وصف تفصيلي للسجل الجنائي هنا..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="police-input min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleEditRecord} className="police-button" disabled={isSubmitting}>
              {isSubmitting ? "جاري التحديث..." : "تحديث السجل"}
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
              هل أنت متأكد من رغبتك في حذف هذا السجل الجنائي؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CriminalRecordsPage;
