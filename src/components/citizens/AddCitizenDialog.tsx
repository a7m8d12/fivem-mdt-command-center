import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Citizen } from '@/types';

interface AddCitizenDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCitizen: (citizen: Citizen) => void;
}

const AddCitizenDialog = ({ isOpen, onOpenChange, onAddCitizen }: AddCitizenDialogProps) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  
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

  const handleAddCitizen = async () => {
    // Validate input
    if (!newCitizen.first_name) {
      toast.error("الرجاء إدخال الاسم الأول");
      return;
    }
    
    if (!newCitizen.last_name) {
      toast.error("الرجاء إدخال الاسم الأخير");
      return;
    }

    if (!newCitizen.date_of_birth) {
      toast.error("الرجاء إدخال تاريخ الميلاد");
      return;
    }
    
    if (!newCitizen.gender) {
      toast.error("الرجاء تحديد الجنس");
      return;
    }
    
    try {
      setIsCreating(true);
      
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
        
        onAddCitizen(newCitizenData);
      }
      
      onOpenChange(false);
      
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
      
      toast.success("تمت إضافة المواطن بنجاح");
      
      // Create notification
      await supabase.from('notifications').insert({
        title: 'تم إضافة مواطن جديد',
        description: `تم إضافة المواطن ${newCitizen.first_name} ${newCitizen.last_name}`,
        read: false,
        type: 'info',
        created_by: user?.id
      });
      
    } catch (error) {
      console.error('Error adding citizen:', error);
      toast.error("فشل في إضافة المواطن");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              onValueChange={(value: 'valid' | 'suspended' | 'revoked' | 'none') => 
                setNewCitizen({...newCitizen, license_status: value})
              }
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            className="police-button" 
            onClick={handleAddCitizen}
            disabled={isCreating}
          >
            {isCreating ? 'جاري الإضافة...' : 'إضافة المواطن'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCitizenDialog;
