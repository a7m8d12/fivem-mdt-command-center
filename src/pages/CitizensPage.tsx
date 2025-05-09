import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  UserX,
  Car,
  FileText,
  ClipboardList
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Citizen } from '@/types';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

const CitizensPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // New citizen form state with properly typed license_status
  const [newCitizen, setNewCitizen] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    address: '',
    phone: '',
    license_status: 'valid' as 'valid' | 'suspended' | 'revoked' | 'none',
  });
  
  // Fetch citizens from Supabase
  useEffect(() => {
    const fetchCitizens = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('citizens')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        // Transform data to match Citizen type
        const transformedData: Citizen[] = data.map((citizen: any) => ({
          id: citizen.id,
          first_name: citizen.first_name,
          last_name: citizen.last_name,
          date_of_birth: citizen.date_of_birth,
          gender: citizen.gender,
          address: citizen.address || '',
          phone: citizen.phone || '',
          image_url: citizen.image_url,
          license_status: citizen.license_status as 'valid' | 'suspended' | 'revoked' | 'none' || 'none',
          created_at: citizen.created_at,
        }));
        
        setCitizens(transformedData);
      } catch (error) {
        console.error('Error fetching citizens:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في جلب بيانات المواطنين',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCitizens();
  }, [toast]);

  // Filter citizens based on search
  const filteredCitizens = searchQuery
    ? citizens.filter((citizen) => 
        `${citizen.first_name} ${citizen.last_name}`.includes(searchQuery) ||
        (citizen.phone && citizen.phone.includes(searchQuery)))
    : citizens;

  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setIsDialogOpen(true);
  };

  const handleAddCitizen = async () => {
    // Validate input
    if (!newCitizen.first_name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم الأول",
        variant: "destructive",
      });
      return;
    }
    
    if (!newCitizen.last_name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم الأخير",
        variant: "destructive",
      });
      return;
    }

    if (!newCitizen.date_of_birth) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال تاريخ الميلاد",
        variant: "destructive",
      });
      return;
    }
    
    if (!newCitizen.gender) {
      toast({
        title: "خطأ",
        description: "الرجاء تحديد الجنس",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Add new citizen to Supabase
      const { data, error } = await supabase.from('citizens').insert({
        first_name: newCitizen.first_name,
        last_name: newCitizen.last_name,
        date_of_birth: newCitizen.date_of_birth,
        gender: newCitizen.gender,
        address: newCitizen.address || null,
        phone: newCitizen.phone || null,
        license_status: newCitizen.license_status,
        created_by: user?.id || '00000000-0000-0000-0000-000000000000'
      }).select();
      
      if (error) {
        throw error;
      }
      
      // Add the new citizen to the local state
      if (data && data.length > 0) {
        const newCitizenData: Citizen = {
          id: data[0].id,
          first_name: data[0].first_name,
          last_name: data[0].last_name,
          date_of_birth: data[0].date_of_birth,
          gender: data[0].gender,
          address: data[0].address || '',
          phone: data[0].phone || '',
          license_status: data[0].license_status as 'valid' | 'suspended' | 'revoked' | 'none',
          created_at: data[0].created_at,
        };
        
        setCitizens([newCitizenData, ...citizens]);
      }
      
      setIsAddDialogOpen(false);
      
      // Reset form with proper typing
      setNewCitizen({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        address: '',
        phone: '',
        license_status: 'valid' as 'valid' | 'suspended' | 'revoked' | 'none',
      });
      
      toast({
        title: "تم بنجاح",
        description: "تمت إضافة المواطن بنجاح",
      });
    } catch (error) {
      console.error('Error adding citizen:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المواطن",
        variant: "destructive",
      });
    }
  };

  // Fetch criminal records for a citizen from database
  const getCitizenCriminalRecords = async (citizenId: string) => {
    try {
      const { data, error } = await supabase
        .from('criminal_records')
        .select(`
          *,
          profiles:officer_id (name)
        `)
        .eq('citizen_id', citizenId);
        
      if (error) {
        throw error;
      }
      
      return data.map((record: any) => ({
        id: record.id,
        citizen_id: record.citizen_id,
        offense: record.offense,
        description: record.description,
        date: record.date,
        officer_id: record.officer_id,
        officer_name: record.profiles?.name || 'ضابط غير معروف',
        status: record.status || 'active',
        created_at: record.created_at,
      }));
    } catch (error) {
      console.error('Error fetching criminal records:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب السجلات الجنائية',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Fetch vehicles for a citizen from database
  const getCitizenVehicles = async (citizenId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('citizen_id', citizenId);
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب المركبات',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Fetch citations for a citizen from database
  const getCitizenCitations = async (citizenId: string) => {
    try {
      const { data, error } = await supabase
        .from('citations')
        .select(`
          *,
          profiles:officer_id (name)
        `)
        .eq('citizen_id', citizenId);
        
      if (error) {
        throw error;
      }
      
      return data.map((citation: any) => ({
        id: citation.id,
        citizen_id: citation.citizen_id,
        violation: citation.violation,
        fine_amount: citation.fine_amount,
        date: citation.date,
        location: citation.location,
        officer_id: citation.officer_id,
        officer_name: citation.profiles?.name || 'ضابط غير معروف',
        paid: citation.paid,
        created_at: citation.created_at,
      }));
    } catch (error) {
      console.error('Error fetching citations:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب المخالفات',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Fetch arrest reports for a citizen from database
  const getCitizenArrestReports = async (citizenId: string) => {
    try {
      const { data, error } = await supabase
        .from('arrest_reports')
        .select(`
          *,
          profiles:officer_id (name)
        `)
        .eq('citizen_id', citizenId);
        
      if (error) {
        throw error;
      }
      
      return data.map((report: any) => ({
        id: report.id,
        citizen_id: report.citizen_id,
        officer_id: report.officer_id,
        officer_name: report.profiles?.name || 'ضابط غير معروف',
        charges: report.charges,
        narrative: report.narrative,
        arrest_date: report.arrest_date,
        location: report.location,
        created_at: report.created_at,
      }));
    } catch (error) {
      console.error('Error fetching arrest reports:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب تقارير الاعتقال',
        variant: 'destructive',
      });
      return [];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="badge-green">صالحة</Badge>;
      case 'suspended':
        return <Badge className="badge-yellow">موقوفة</Badge>;
      case 'revoked':
        return <Badge className="badge-red">ملغاة</Badge>;
      case 'none':
        return <Badge variant="outline">لا يوجد</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">المواطنون</h2>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مواطن
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="بحث عن مواطن..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="police-input pr-10"
        />
      </div>
      
      <div className="border border-border/50 rounded-md overflow-hidden">
        <table className="police-table">
          <thead>
            <tr>
              <th className="w-1/6">الاسم الكامل</th>
              <th className="w-1/6">تاريخ الميلاد</th>
              <th className="w-1/6">رقم الهاتف</th>
              <th className="w-1/6">رخصة القيادة</th>
              <th className="w-1/4">العنوان</th>
              <th className="w-1/12"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredCitizens.length > 0 ? (
              filteredCitizens.map((citizen) => (
                <tr
                  key={citizen.id}
                  className="cursor-pointer"
                  onClick={() => handleSelectCitizen(citizen)}
                >
                  <td className="font-medium">{citizen.first_name} {citizen.last_name}</td>
                  <td>{formatDate(citizen.date_of_birth)}</td>
                  <td dir="ltr">{citizen.phone}</td>
                  <td>{getLicenseStatusBadge(citizen.license_status)}</td>
                  <td>{citizen.address}</td>
                  <td>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  لا توجد نتائج مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedCitizen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl">معلومات المواطن</DialogTitle>
              <DialogDescription>عرض معلومات المواطن وسجلاته</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="police-card overflow-hidden flex flex-col items-center p-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-secondary/80">
                    {selectedCitizen.image_url ? (
                      <img 
                        src={selectedCitizen.image_url} 
                        alt={`${selectedCitizen.first_name} ${selectedCitizen.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-foreground">
                        <span className="text-3xl">{selectedCitizen.first_name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-center mb-1">
                    {selectedCitizen.first_name} {selectedCitizen.last_name}
                  </h2>
                  
                  <div className="text-sm text-muted-foreground text-center">
                    الهوية الوطنية: {selectedCitizen.id.substring(0, 8)}
                  </div>
                  
                  <div className="mt-4 w-full">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">الجنس:</div>
                      <div>{selectedCitizen.gender}</div>
                      
                      <div className="font-medium">تاريخ الميلاد:</div>
                      <div>{formatDate(selectedCitizen.date_of_birth)}</div>
                      
                      <div className="font-medium">رقم الهاتف:</div>
                      <div dir="ltr">{selectedCitizen.phone}</div>
                      
                      <div className="font-medium">رخصة القيادة:</div>
                      <div>{getLicenseStatusBadge(selectedCitizen.license_status)}</div>
                    </div>
                    
                    <div className="mt-4 text-sm">
                      <div className="font-medium mb-1">العنوان:</div>
                      <div className="bg-secondary/50 p-2 rounded-md text-foreground">
                        {selectedCitizen.address || "غير متوفر"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <CitizenDetailsTabs 
                  citizenId={selectedCitizen.id} 
                  getCriminalRecords={getCitizenCriminalRecords}
                  getVehicles={getCitizenVehicles}
                  getCitations={getCitizenCitations}
                  getArrestReports={getCitizenArrestReports}
                  formatDate={formatDate}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Citizen Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة مواطن جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">الاسم الأول *</Label>
                <Input
                  id="first_name"
                  placeholder="أدخل الاسم الأول"
                  value={newCitizen.first_name}
                  onChange={(e) => setNewCitizen({...newCitizen, first_name: e.target.value})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">الاسم الأخير *</Label>
                <Input
                  id="last_name"
                  placeholder="أدخل الاسم الأخير"
                  value={newCitizen.last_name}
                  onChange={(e) => setNewCitizen({...newCitizen, last_name: e.target.value})}
                  className="police-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">تاريخ الميلاد *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={newCitizen.date_of_birth}
                  onChange={(e) => setNewCitizen({...newCitizen, date_of_birth: e.target.value})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">الجنس *</Label>
                <Select 
                  value={newCitizen.gender} 
                  onValueChange={(value) => setNewCitizen({...newCitizen, gender: value})}
                >
                  <SelectTrigger id="gender" className="police-input">
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ذكر">ذكر</SelectItem>
                    <SelectItem value="أنثى">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                placeholder="أدخل رقم الهاتف"
                value={newCitizen.phone}
                onChange={(e) => setNewCitizen({...newCitizen, phone: e.target.value})}
                className="police-input"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                placeholder="أدخل العنوان"
                value={newCitizen.address}
                onChange={(e) => setNewCitizen({...newCitizen, address: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="license_status">حالة رخصة القيادة</Label>
              <Select 
                value={newCitizen.license_status} 
                onValueChange={(value) => setNewCitizen({...newCitizen, license_status: value})}
              >
                <SelectTrigger id="license_status" className="police-input">
                  <SelectValue placeholder="اختر حالة الرخصة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valid">صالحة</SelectItem>
                  <SelectItem value="suspended">موقوفة</SelectItem>
                  <SelectItem value="revoked">ملغاة</SelectItem>
                  <SelectItem value="none">لا يوجد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddCitizen}>
              إضافة المواطن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Separate component for tabs to improve file organization and readability
const CitizenDetailsTabs = ({ 
  citizenId, 
  getCriminalRecords,
  getVehicles,
  getCitations,
  getArrestReports,
  formatDate 
}: { 
  citizenId: string;
  getCriminalRecords: (id: string) => Promise<any[]>;
  getVehicles: (id: string) => Promise<any[]>;
  getCitations: (id: string) => Promise<any[]>;
  getArrestReports: (id: string) => Promise<any[]>;
  formatDate: (date: string) => string;
}) => {
  const [criminalRecords, setCriminalRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [arrestReports, setArrestReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('criminal');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadTabData = async () => {
      setIsLoading(true);
      
      if (activeTab === 'criminal') {
        const records = await getCriminalRecords(citizenId);
        setCriminalRecords(records);
      } else if (activeTab === 'vehicles') {
        const vehicleData = await getVehicles(citizenId);
        setVehicles(vehicleData);
      } else if (activeTab === 'citations') {
        const citationData = await getCitations(citizenId);
        setCitations(citationData);
      } else if (activeTab === 'reports') {
        const reportData = await getArrestReports(citizenId);
        setArrestReports(reportData);
      }
      
      setIsLoading(false);
    };
    
    loadTabData();
  }, [activeTab, citizenId, getCriminalRecords, getVehicles, getCitations, getArrestReports]);
  
  return (
    <Tabs defaultValue="criminal" onValueChange={(value) => setActiveTab(value)}>
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="criminal" className="flex items-center">
          <UserX className="ml-2 h-4 w-4" /> السجل الجنائي
        </TabsTrigger>
        <TabsTrigger value="vehicles" className="flex items-center">
          <Car className="ml-2 h-4 w-4" /> المركبات
        </TabsTrigger>
        <TabsTrigger value="citations" className="flex items-center">
          <ClipboardList className="ml-2 h-4 w-4" /> المخالفات
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center">
          <FileText className="ml-2 h-4 w-4" /> التقارير
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="criminal" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">السجل الجنائي</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : criminalRecords.length > 0 ? (
            <div className="border border-border/50 rounded-md overflow-hidden">
              <table className="police-table">
                <thead>
                  <tr>
                    <th>المخالفة</th>
                    <th>التاريخ</th>
                    <th>الضابط المسؤول</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {criminalRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="font-medium">{record.offense}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.officer_name}</td>
                      <td>
                        {record.status === 'active' && <Badge className="badge-red">نشطة</Badge>}
                        {record.status === 'completed' && <Badge className="badge-green">مكتملة</Badge>}
                        {record.status === 'dismissed' && <Badge className="badge-blue">ملغاة</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا يوجد سجل جنائي لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="vehicles" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">المركبات</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : vehicles.length > 0 ? (
            <div className="border border-border/50 rounded-md overflow-hidden">
              <table className="police-table">
                <thead>
                  <tr>
                    <th>رقم اللوحة</th>
                    <th>الموديل</th>
                    <th>اللون</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="font-medium" dir="ltr">{vehicle.plate}</td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.color}</td>
                      <td>
                        {vehicle.stolen ? (
                          <Badge className="badge-red">مسروقة</Badge>
                        ) : vehicle.registered ? (
                          <Badge className="badge-green">مسجلة</Badge>
                        ) : (
                          <Badge className="badge-yellow">غير مسجلة</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد مركبات مسجلة لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="citations" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">المخالفات المرورية</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : citations.length > 0 ? (
            <div className="border border-border/50 rounded-md overflow-hidden">
              <table className="police-table">
                <thead>
                  <tr>
                    <th>المخالفة</th>
                    <th>الغرامة</th>
                    <th>التاريخ</th>
                    <th>الضابط المسؤول</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {citations.map((citation) => (
                    <tr key={citation.id}>
                      <td className="font-medium">{citation.violation}</td>
                      <td>{citation.fine_amount} دينار عراقي</td>
                      <td>{formatDate(citation.date)}</td>
                      <td>{citation.officer_name}</td>
                      <td>
                        {citation.paid ? (
                          <Badge className="badge-green">مدفوعة</Badge>
                        ) : (
                          <Badge className="badge-red">غير مدفوعة</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد مخالفات مرورية لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="reports" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">تقارير الاعتقال</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : arrestReports.length > 0 ? (
            <div className="space-y-4">
              {arrestReports.map((report) => (
                <div key={report.id} className="border border-border/50 rounded-md p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold">تقرير اعتقال</h4>
                      <p className="text-sm text-muted-foreground">
                        بتاريخ {formatDate(report.arrest_date)} - الضابط: {report.officer_name}
                      </p>
                    </div>
                    <Badge className="badge-red">اعتقال</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">التهم:</h5>
                      <div className="flex flex-wrap gap-2">
                        {report.charges && report.charges.map((charge: string, index: number) => (
                          <Badge key={index} variant="outline">{charge}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-1">المكان:</h5>
                      <p className="text-sm bg-secondary/50 p-2 rounded-md">
                        {report.location}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-1">تفاصيل الاعتقال:</h5>
                      <p className="text-sm bg-secondary/50 p-2 rounded-md whitespace-pre-line">
                        {report.narrative}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد تقارير اعتقال لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default CitizensPage;
