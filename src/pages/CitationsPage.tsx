import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Check,
  X
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
import { supabase } from "@/integrations/supabase/client";
import { Citizen, Citation } from '@/types';

const CitationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // New citation form state
  const [newCitation, setNewCitation] = useState({
    citizen_id: '',
    violation: '',
    fine_amount: 500,
    date: new Date().toISOString().split('T')[0],
    location: '',
    paid: false
  });

  // Fetch citations and citizens from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch citizens for the dropdown
        const { data: citizensData, error: citizensError } = await supabase
          .from('citizens')
          .select('id, first_name, last_name');
          
        if (citizensError) {
          throw citizensError;
        }
        
        // Transform citizens data to match Citizen type
        const transformedCitizens: Citizen[] = citizensData.map((citizen: any) => ({
          id: citizen.id,
          first_name: citizen.first_name,
          last_name: citizen.last_name,
          date_of_birth: '',  // These fields aren't needed for the dropdown
          gender: '',
          address: '',
          phone: '',
          license_status: 'valid',
          created_at: ''
        }));
        
        setCitizens(transformedCitizens);
        
        // Fetch citations
        const { data: citationsData, error: citationsError } = await supabase
          .from('citations')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (citationsError) throw citationsError;
        
        if (!citationsData || citationsData.length === 0) {
          setCitations([]);
          setIsLoading(false);
          return;
        }
        
        // Create a map of citizen IDs to names
        const citizenMap = new Map();
        citizensData?.forEach((citizen: any) => {
          citizenMap.set(citizen.id, `${citizen.first_name} ${citizen.last_name}`);
        });
        
        // Fetch officer data separately
        const officerIds = citationsData.map((citation: any) => citation.officer_id).filter(Boolean);
        const uniqueOfficerIds = [...new Set(officerIds)];
        
        let officerMap = new Map();
        if (uniqueOfficerIds.length > 0) {
          const { data: officersData, error: officersError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueOfficerIds);
            
          if (!officersError && officersData) {
            officersData.forEach((officer: any) => {
              officerMap.set(officer.id, officer.name);
            });
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
        citation.citizen_name.includes(searchQuery) ||
        citation.violation.includes(searchQuery) ||
        citation.location.includes(searchQuery))
    : citations;

  const handleAddCitation = async () => {
    // Validate input
    if (!newCitation.citizen_id) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!newCitation.violation) {
      toast.error("الرجاء إدخال المخالفة");
      return;
    }

    if (newCitation.fine_amount <= 0) {
      toast.error("الرجاء إدخال مبلغ غرامة صحيح");
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
          officer_id: user?.id,
          paid: newCitation.paid
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add to local state
        const citizen = citizens.find(c => c.id === newCitation.citizen_id);
        const newCitationData: Citation = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          citizen_name: citizen ? `${citizen.first_name} ${citizen.last_name}` : 'مواطن غير معروف',
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
        
        // Add notification
        await supabase.from('notifications').insert({
          title: 'مخالفة جديدة',
          description: `تم إصدار مخالفة جديدة للمواطن ${newCitationData.citizen_name}`,
          read: false,
          type: 'info',
          created_by: user?.id,
          related_to: data[0].id
        });
      }
      
      setIsAddDialogOpen(false);
      
      // Reset form
      setNewCitation({
        citizen_id: '',
        violation: '',
        fine_amount: 500,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Common violations
  const commonViolations = [
    "تجاوز السرعة المسموح بها",
    "عدم ربط حزام الأمان",
    "استخدام الهاتف أثناء القيادة",
    "قطع الإشارة الحمراء",
    "وقوف في مكان ممنوع",
    "قيادة بدون رخصة",
    "عدم حمل وثائق المركبة",
    "تجاوز خاطئ",
    "عدم إعطاء أولوية المرور",
    "قيادة مركبة غير مسجلة",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">المخالفات المرورية</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مخالفة
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث باسم المواطن أو نوع المخالفة..."
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
                <tr key={citation.id} className="cursor-pointer">
                  <td className="font-medium">{citation.citizen_name}</td>
                  <td>{citation.violation}</td>
                  <td>{citation.fine_amount} ريال</td>
                  <td>{formatDate(citation.date)}</td>
                  <td>{citation.location || 'غير محدد'}</td>
                  <td>{citation.officer_name}</td>
                  <td>
                    {citation.paid ? (
                      <Badge className="badge-green">مدفوعة</Badge>
                    ) : (
                      <Badge className="badge-red">غير مدفوعة</Badge>
                    )}
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
                      {`${citizen.first_name} ${citizen.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violation">المخالفة *</Label>
              <Select
                value={newCitation.violation}
                onValueChange={(value) => setNewCitation({...newCitation, violation: value})}
              >
                <SelectTrigger id="violation" className="police-input">
                  <SelectValue placeholder="اختر نوع المخالفة" />
                </SelectTrigger>
                <SelectContent>
                  {commonViolations.map((violation) => (
                    <SelectItem key={violation} value={violation}>
                      {violation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fine_amount">مبلغ الغرامة (ريال) *</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fine_amount"
                    type="number"
                    min="0"
                    value={newCitation.fine_amount}
                    onChange={(e) => setNewCitation({...newCitation, fine_amount: parseInt(e.target.value) || 0})}
                    className="police-input pr-10"
                  />
                </div>
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
                className="h-4 w-4 rounded border-gray-300 text-police-blue focus:ring-police-blue"
              />
              <Label htmlFor="paid" className="text-sm font-normal">
                تم دفع الغرامة
              </Label>
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
    </div>
  );
};

export default CitationsPage;
