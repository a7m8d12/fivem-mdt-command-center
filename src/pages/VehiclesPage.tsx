
import React, { useState, useEffect } from 'react';
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
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

const VehiclesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch vehicles and citizens from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch vehicles with citizen information
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select(`
            *,
            citizens (first_name, last_name)
          `);
          
        if (vehiclesError) throw vehiclesError;
        
        // Transform data
        const transformedVehicles = vehiclesData.map((v: any) => ({
          id: v.id,
          citizen_id: v.citizen_id,
          citizen_name: v.citizens ? `${v.citizens.first_name} ${v.citizens.last_name}` : 'مواطن غير معروف',
          plate: v.plate,
          model: v.model,
          color: v.color,
          registered: v.registered,
          stolen: v.stolen,
          created_at: v.created_at
        }));
        
        setVehicles(transformedVehicles);
        
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

  const handleAddVehicle = async () => {
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
    
    try {
      // Add vehicle to Supabase
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          citizen_id: newVehicle.citizen_id,
          plate: newVehicle.plate.toUpperCase(),
          model: newVehicle.model,
          color: newVehicle.color,
          registered: newVehicle.registered,
          stolen: newVehicle.stolen,
          created_by: user?.id || '00000000-0000-0000-0000-000000000000'
        })
        .select(`
          *,
          citizens (first_name, last_name)
        `);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add to local state
        const newVehicleData = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          citizen_name: data[0].citizens ? `${data[0].citizens.first_name} ${data[0].citizens.last_name}` : 'مواطن غير معروف',
          plate: data[0].plate,
          model: data[0].model,
          color: data[0].color,
          registered: data[0].registered,
          stolen: data[0].stolen,
          created_at: data[0].created_at
        };
        
        setVehicles([newVehicleData, ...vehicles]);
      }
      
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
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error("فشل في إضافة المركبة");
    }
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
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="cursor-pointer">
                  <td className="font-medium" dir="ltr">{vehicle.plate}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.color}</td>
                  <td>{vehicle.citizen_name}</td>
                  <td>{formatDate(vehicle.created_at)}</td>
                  <td>{getStatusBadge(vehicle)}</td>
                </tr>
              ))
            ) : (
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
            <DialogDescription className="text-center">أدخل معلومات المركبة التي تريد إضافتها</DialogDescription>
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
