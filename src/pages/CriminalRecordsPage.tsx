import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  UserX,
  Calendar
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Citizen, CriminalRecord } from '@/types';

const CriminalRecordsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [records, setRecords] = useState<CriminalRecord[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // New record form state
  const [newRecord, setNewRecord] = useState({
    citizen_id: '',
    offense: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'completed' | 'dismissed',
  });

  // Fetch criminal records and citizens from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch citizens for the dropdown
        const { data: citizensData, error: citizensError } = await supabase
          .from('citizens')
          .select('id, first_name, last_name, date_of_birth');
          
        if (citizensError) {
          throw citizensError;
        }
        
        // Transform citizens data to match Citizen type
        const transformedCitizens: Citizen[] = citizensData.map((citizen: any) => ({
          id: citizen.id,
          first_name: citizen.first_name,
          last_name: citizen.last_name,
          date_of_birth: citizen.date_of_birth,
          gender: '',  // These fields aren't needed for the dropdown
          address: '',
          phone: '',
          license_status: 'valid',
          created_at: ''
        }));
        
        setCitizens(transformedCitizens);
        
        // Fetch criminal records
        const { data: recordsData, error: recordsError } = await supabase
          .from('criminal_records')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (recordsError) {
          throw recordsError;
        }
        
        if (!recordsData || recordsData.length === 0) {
          setRecords([]);
          setIsLoading(false);
          return;
        }
        
        // Create a map of citizen IDs to names
        const citizenMap = new Map();
        citizensData.forEach((citizen: any) => {
          citizenMap.set(citizen.id, `${citizen.first_name} ${citizen.last_name}`);
        });
        
        // Separately fetch officer names since there's no relation set up
        const officerIds = recordsData.map((record: any) => record.officer_id).filter(Boolean);
        const uniqueOfficerIds = [...new Set(officerIds)];
        
        let officerMap = new Map();
        if (uniqueOfficerIds.length > 0) {
          const { data: officersData, error: officersError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueOfficerIds);
            
          if (officersError) {
            console.error('Error fetching officer data:', officersError);
            // Continue even if there's an error fetching officer data
          } else if (officersData) {
            officersData.forEach((officer: any) => {
              officerMap.set(officer.id, officer.name);
            });
          }
        }
        
        // Transform criminal records data
        const transformedRecords: CriminalRecord[] = recordsData.map((record: any) => ({
          id: record.id,
          citizen_id: record.citizen_id,
          offense: record.offense,
          description: record.description || '',
          date: record.date,
          officer_id: record.officer_id,
          officer_name: officerMap.get(record.officer_id) || 'ضابط غير معروف',
          status: record.status as 'active' | 'completed' | 'dismissed',
          created_at: record.created_at,
        }));
        
        setRecords(transformedRecords);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('فشل في جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter records based on search query
  const filteredRecords = searchQuery
    ? records.filter(record => 
        getCitizenName(record.citizen_id).includes(searchQuery) ||
        record.offense.includes(searchQuery))
    : records;

  const getCitizenName = (citizenId: string) => {
    const citizen = citizens.find(c => c.id === citizenId);
    return citizen ? `${citizen.first_name} ${citizen.last_name}` : 'مواطن غير معروف';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="badge-red">نشطة</Badge>;
    } else if (status === 'completed') {
      return <Badge className="badge-green">مكتملة</Badge>;
    } else if (status === 'dismissed') {
      return <Badge className="badge-blue">ملغاة</Badge>;
    } else {
      return <Badge>{status}</Badge>;
    }
  };

  const handleAddRecord = async () => {
    // Validate input
    if (!newRecord.citizen_id) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!newRecord.offense) {
      toast.error("الرجاء إدخال المخالفة");
      return;
    }

    try {
      // Add record to Supabase
      const { data, error } = await supabase
        .from('criminal_records')
        .insert({
          citizen_id: newRecord.citizen_id,
          offense: newRecord.offense,
          description: newRecord.description,
          date: newRecord.date,
          officer_id: user?.id || '00000000-0000-0000-0000-000000000000',
          status: newRecord.status
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add to local state
        const citizen = citizens.find(c => c.id === newRecord.citizen_id);
        const newRecordData: CriminalRecord = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          offense: data[0].offense,
          description: data[0].description || '',
          date: data[0].date,
          officer_id: data[0].officer_id,
          officer_name: user?.name || 'ضابط غير معروف',
          status: data[0].status as 'active' | 'completed' | 'dismissed',
          created_at: data[0].created_at
        };
        
        setRecords([newRecordData, ...records]);
        
        // Add notification
        await supabase.from('notifications').insert({
          title: 'سجل جنائي جديد',
          description: `تم إضافة سجل جنائي للمواطن ${citizen ? `${citizen.first_name} ${citizen.last_name}` : 'مواطن غير معروف'}`,
          read: false,
          type: 'warning',
          created_by: user?.id,
          related_to: data[0].id
        });
      }
      
      setIsAddDialogOpen(false);
      
      // Reset form
      setNewRecord({
        citizen_id: '',
        offense: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      
      toast.success("تم إضافة السجل الجنائي بنجاح");
    } catch (error) {
      console.error('Error adding criminal record:', error);
      toast.error("فشل في إضافة السجل الجنائي");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Common offenses
  const commonOffenses = [
    "قيادة بتهور",
    "قيادة تحت تأثير المخدرات",
    "تجاوز السرعة المسموح بها",
    "مخالفة أنظمة المرور",
    "حيازة مواد ممنوعة",
    "مقاومة رجال الأمن",
    "اخلال بالأمن العام",
    "سرقة",
    "اعتداء",
    "تخريب ممتلكات عامة",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserX className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">السجلات الجنائية</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة سجل جنائي
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث باسم المواطن أو المخالفة..."
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
              <th>التاريخ</th>
              <th>الضابط المسؤول</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted-foreground">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="cursor-pointer">
                  <td className="font-medium">{getCitizenName(record.citizen_id)}</td>
                  <td>{record.offense}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.officer_name}</td>
                  <td>{getStatusBadge(record.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted-foreground">
                  لا توجد سجلات جنائية مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة سجل جنائي جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن *</Label>
              <Select 
                value={newRecord.citizen_id} 
                onValueChange={(value) => setNewRecord({...newRecord, citizen_id: value})}
              >
                <SelectTrigger id="citizen" className="police-input">
                  <SelectValue placeholder="اختر المواطن" />
                </SelectTrigger>
                <SelectContent>
                  {citizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      {`${citizen.first_name} ${citizen.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offense">المخالفة *</Label>
                <Select
                  value={newRecord.offense}
                  onValueChange={(value) => setNewRecord({...newRecord, offense: value})}
                >
                  <SelectTrigger id="offense" className="police-input">
                    <SelectValue placeholder="اختر المخالفة" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonOffenses.map((offense) => (
                      <SelectItem key={offense} value={offense}>
                        {offense}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">تاريخ المخالفة *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="أدخل وصفاً تفصيلياً للمخالفة..."
                value={newRecord.description}
                onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                className="police-input min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select 
                value={newRecord.status} 
                onValueChange={(value: any) => setNewRecord({...newRecord, status: value})}
              >
                <SelectTrigger id="status" className="police-input">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="dismissed">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddRecord}>
              إضافة السجل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CriminalRecordsPage;
