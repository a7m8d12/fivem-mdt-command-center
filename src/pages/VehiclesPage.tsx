
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  Car,
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Mock data for vehicles
const mockVehicles = [
  {
    id: '201',
    citizen_id: '1',
    citizen_name: 'أحمد السالم',
    plate: 'ACB 1234',
    model: 'تويوتا كامري 2022',
    color: 'أبيض',
    registered: true,
    stolen: false,
    created_at: '2023-01-20T08:30:00.000Z',
  },
  {
    id: '202',
    citizen_id: '1',
    citizen_name: 'أحمد السالم',
    plate: 'XYZ 5678',
    model: 'نيسان باترول 2020',
    color: 'أسود',
    registered: true,
    stolen: false,
    created_at: '2023-02-15T10:15:00.000Z',
  },
  {
    id: '203',
    citizen_id: '3',
    citizen_name: 'خالد المحمد',
    plate: 'LMN 9012',
    model: 'هوندا أكورد 2021',
    color: 'فضي',
    registered: false,
    stolen: true,
    created_at: '2023-03-05T14:45:00.000Z',
  },
  {
    id: '204',
    citizen_id: '2',
    citizen_name: 'سارة العتيبي',
    plate: 'DEF 3456',
    model: 'مرسيدس E-Class 2023',
    color: 'أزرق',
    registered: true,
    stolen: false,
    created_at: '2023-04-10T09:20:00.000Z',
  },
  {
    id: '205',
    citizen_id: '4',
    citizen_name: 'منى الحربي',
    plate: 'GHI 7890',
    model: 'لكزس RX 2022',
    color: 'أحمر',
    registered: true,
    stolen: false,
    created_at: '2023-05-15T11:30:00.000Z',
  },
];

// Mock citizens data
const mockCitizens = [
  { id: '1', name: 'أحمد السالم' },
  { id: '2', name: 'سارة العتيبي' },
  { id: '3', name: 'خالد المحمد' },
  { id: '4', name: 'منى الحربي' },
  { id: '5', name: 'عبدالله القحطاني' },
];

const VehiclesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const { user } = useAuth();
  
  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    citizen_id: '',
    plate: '',
    model: '',
    color: '',
    registered: true,
    stolen: false,
  });

  // Filter vehicles based on search query
  const filteredVehicles = searchQuery
    ? vehicles.filter(vehicle => 
        vehicle.plate.includes(searchQuery) ||
        vehicle.model.includes(searchQuery) ||
        vehicle.citizen_name.includes(searchQuery))
    : vehicles;

  const getStatusBadge = (vehicle: any) => {
    if (vehicle.stolen) {
      return <Badge className="badge-red">مسروقة</Badge>;
    } else if (!vehicle.registered) {
      return <Badge className="badge-yellow">غير مسجلة</Badge>;
    } else {
      return <Badge className="badge-green">مسجلة</Badge>;
    }
  };

  const handleAddVehicle = () => {
    // Validate input
    if (!newVehicle.citizen_id) {
      toast.error("الرجاء اختيار مالك المركبة");
      return;
    }

    if (!newVehicle.plate) {
      toast.error("الرجاء إدخال رقم اللوحة");
      return;
    }

    if (!newVehicle.model) {
      toast.error("الرجاء إدخال موديل المركبة");
      return;
    }

    if (!newVehicle.color) {
      toast.error("الرجاء إدخال لون المركبة");
      return;
    }

    // Find citizen name
    const citizen = mockCitizens.find(c => c.id === newVehicle.citizen_id);
    
    // Add new vehicle
    const newVehicleComplete = {
      id: (vehicles.length + 1).toString(),
      citizen_id: newVehicle.citizen_id,
      citizen_name: citizen ? citizen.name : 'مواطن غير معروف',
      plate: newVehicle.plate.toUpperCase(),
      model: newVehicle.model,
      color: newVehicle.color,
      registered: newVehicle.registered,
      stolen: newVehicle.stolen,
      created_at: new Date().toISOString(),
    };
    
    setVehicles([newVehicleComplete, ...vehicles]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewVehicle({
      citizen_id: '',
      plate: '',
      model: '',
      color: '',
      registered: true,
      stolen: false,
    });
    
    toast.success("تمت إضافة المركبة بنجاح");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Car className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">المركبات</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مركبة
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن مركبة برقم اللوحة أو الموديل..."
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
              <th>رقم اللوحة</th>
              <th>الموديل</th>
              <th>اللون</th>
              <th>المالك</th>
              <th>تاريخ التسجيل</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="cursor-pointer">
                <td className="font-medium" dir="ltr">{vehicle.plate}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.color}</td>
                <td>{vehicle.citizen_name}</td>
                <td>{formatDate(vehicle.created_at)}</td>
                <td>{getStatusBadge(vehicle)}</td>
              </tr>
            ))}
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  لا توجد مركبات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة مركبة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المالك *</Label>
              <Select 
                value={newVehicle.citizen_id} 
                onValueChange={(value) => setNewVehicle({...newVehicle, citizen_id: value})}
              >
                <SelectTrigger id="citizen" className="police-input">
                  <SelectValue placeholder="اختر المالك" />
                </SelectTrigger>
                <SelectContent>
                  {mockCitizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      {citizen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plate">رقم اللوحة *</Label>
                <Input
                  id="plate"
                  placeholder="مثال: ABC 1234"
                  dir="ltr"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                  className="police-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">الموديل *</Label>
                <Input
                  id="model"
                  placeholder="مثال: تويوتا كامري 2022"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  className="police-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">اللون *</Label>
              <Input
                id="color"
                placeholder="مثال: أبيض"
                value={newVehicle.color}
                onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                className="police-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Label htmlFor="registered" className="flex-shrink-0">مسجلة</Label>
                <Switch
                  id="registered"
                  checked={newVehicle.registered}
                  onCheckedChange={(checked) => setNewVehicle({...newVehicle, registered: checked})}
                />
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Label htmlFor="stolen" className="flex-shrink-0">مسروقة</Label>
                <Switch
                  id="stolen"
                  checked={newVehicle.stolen}
                  onCheckedChange={(checked) => setNewVehicle({...newVehicle, stolen: checked})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddVehicle}>
              إضافة المركبة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehiclesPage;
