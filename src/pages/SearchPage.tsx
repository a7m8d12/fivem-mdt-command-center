
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search as SearchIcon,
  User,
  Car,
  FileText,
  ArrowRight
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

// Mock data - combining and importing all mock data from other components
const mockCitizens = [
  { id: '1', name: 'أحمد السالم', phone: '0551234567', address: 'حي النزهة، الرياض' },
  { id: '2', name: 'سارة العتيبي', phone: '0559876543', address: 'حي الورود، جدة' },
  { id: '3', name: 'خالد المحمد', phone: '0554567890', address: 'حي الروضة، الدمام' },
  { id: '4', name: 'منى الحربي', phone: '0556789012', address: 'حي البساتين، أبها' },
  { id: '5', name: 'عبدالله القحطاني', phone: '0552345678', address: 'حي المروج، الرياض' },
];

const mockVehicles = [
  { id: '201', plate: 'ACB 1234', model: 'تويوتا كامري 2022', color: 'أبيض', owner: 'أحمد السالم', registered: true, stolen: false },
  { id: '202', plate: 'XYZ 5678', model: 'نيسان باترول 2020', color: 'أسود', owner: 'أحمد السالم', registered: true, stolen: false },
  { id: '203', plate: 'LMN 9012', model: 'هوندا أكورد 2021', color: 'فضي', owner: 'خالد المحمد', registered: false, stolen: true },
  { id: '204', plate: 'DEF 3456', model: 'مرسيدس E-Class 2023', color: 'أزرق', owner: 'سارة العتيبي', registered: true, stolen: false },
  { id: '205', plate: 'GHI 7890', model: 'لكزس RX 2022', color: 'أحمر', owner: 'منى الحربي', registered: true, stolen: false },
];

const mockWarrants = [
  { id: '1', citizen: 'أحمد السالم', reason: 'عدم الظهور في المحكمة', status: 'active' },
  { id: '2', citizen: 'خالد المحمد', reason: 'عدم دفع غرامات مرورية متراكمة', status: 'active' },
  { id: '3', citizen: 'سارة العتيبي', reason: 'مخالفة شروط الإفراج المشروط', status: 'expired' },
];

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('citizens');
  const navigate = useNavigate();
  
  // Filter results based on search query and active tab
  const getFilteredResults = () => {
    if (!searchQuery) return [];
    
    switch (activeTab) {
      case 'citizens':
        return mockCitizens.filter(citizen => 
          citizen.name.includes(searchQuery) || 
          citizen.phone.includes(searchQuery));
      
      case 'vehicles':
        return mockVehicles.filter(vehicle => 
          vehicle.plate.includes(searchQuery) || 
          vehicle.model.includes(searchQuery) ||
          vehicle.owner.includes(searchQuery));
      
      case 'warrants':
        return mockWarrants.filter(warrant => 
          warrant.citizen.includes(searchQuery) || 
          warrant.reason.includes(searchQuery));
      
      default:
        return [];
    }
  };
  
  const filteredResults = getFilteredResults();
  
  const getVehicleStatusBadge = (vehicle: any) => {
    if (vehicle.stolen) {
      return <Badge className="badge-red">مسروقة</Badge>;
    } else if (!vehicle.registered) {
      return <Badge className="badge-yellow">غير مسجلة</Badge>;
    } else {
      return <Badge className="badge-green">مسجلة</Badge>;
    }
  };

  const getWarrantStatusBadge = (status: string) => {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The filtering happens automatically when the search query changes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SearchIcon className="ml-2 h-5 w-5 text-police-blue" />
        <h2 className="text-2xl font-bold">بحث</h2>
      </div>
      
      <form onSubmit={handleSearch}>
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="بحث عن مواطن، مركبة، أمر توقيف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="police-input pr-10 text-lg"
            autoFocus
          />
        </div>
      </form>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="citizens" className="mt-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="citizens" className="flex items-center">
            <User className="ml-2 h-4 w-4" /> المواطنون
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center">
            <Car className="ml-2 h-4 w-4" /> المركبات
          </TabsTrigger>
          <TabsTrigger value="warrants" className="flex items-center">
            <FileText className="ml-2 h-4 w-4" /> أوامر التوقيف
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="citizens" className="mt-4">
          <div className="space-y-4">
            {filteredResults.length > 0 ? filteredResults.map((citizen: any) => (
              <div 
                key={citizen.id} 
                className="police-card p-4 hover:bg-secondary/50 cursor-pointer flex justify-between items-center"
                onClick={() => navigate('/citizens')}
              >
                <div>
                  <h3 className="font-medium">{citizen.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    <p dir="ltr">{citizen.phone} • {citizen.address}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )) : (
              searchQuery && <div className="text-center py-8 text-muted-foreground">
                لم يتم العثور على نتائج مطابقة
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                ابدأ بإدخال مصطلح البحث أعلاه
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="vehicles" className="mt-4">
          <div className="space-y-4">
            {filteredResults.length > 0 ? filteredResults.map((vehicle: any) => (
              <div 
                key={vehicle.id} 
                className="police-card p-4 hover:bg-secondary/50 cursor-pointer flex justify-between items-center"
                onClick={() => navigate('/vehicles')}
              >
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <h3 className="font-medium" dir="ltr">{vehicle.plate}</h3>
                    <div className="mx-1">•</div>
                    <div>{vehicle.model}</div>
                    <div>{getVehicleStatusBadge(vehicle)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>المالك: {vehicle.owner} • اللون: {vehicle.color}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )) : (
              searchQuery && <div className="text-center py-8 text-muted-foreground">
                لم يتم العثور على نتائج مطابقة
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                ابدأ بإدخال مصطلح البحث أعلاه
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="warrants" className="mt-4">
          <div className="space-y-4">
            {filteredResults.length > 0 ? filteredResults.map((warrant: any) => (
              <div 
                key={warrant.id} 
                className="police-card p-4 hover:bg-secondary/50 cursor-pointer flex justify-between items-center"
                onClick={() => navigate('/warrants')}
              >
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <h3 className="font-medium">{warrant.citizen}</h3>
                    <div className="mx-1">•</div>
                    <div>{getWarrantStatusBadge(warrant.status)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{warrant.reason}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )) : (
              searchQuery && <div className="text-center py-8 text-muted-foreground">
                لم يتم العثور على نتائج مطابقة
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                ابدأ بإدخال مصطلح البحث أعلاه
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchPage;
