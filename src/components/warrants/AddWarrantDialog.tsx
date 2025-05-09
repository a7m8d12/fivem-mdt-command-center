import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Warrant } from '@/types';

interface AddWarrantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWarrantAdded: (warrant: Warrant) => void;
}

const AddWarrantDialog = ({ isOpen, onOpenChange, onWarrantAdded }: AddWarrantDialogProps) => {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // New warrant form state
  const [newWarrant, setNewWarrant] = useState({
    citizen_id: '',
    reason: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    status: 'active' as 'active' | 'executed' | 'expired'
  });
  
  // Load citizens for dropdown
  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const { data, error } = await supabase
          .from('citizens')
          .select('id, first_name, last_name');
          
        if (error) throw error;
        
        setCitizens(data.map((c: any) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`
        })));
      } catch (error) {
        console.error('Error fetching citizens:', error);
        toast.error('فشل في جلب بيانات المواطنين');
      }
    };
    
    if (isOpen) {
      fetchCitizens();
    }
  }, [isOpen]);

  const handleAddWarrant = async () => {
    // Validate input
    if (!newWarrant.citizen_id) {
      toast.error("الرجاء اختيار مواطن");
      return;
    }

    if (!newWarrant.reason) {
      toast.error("الرجاء إدخال سبب أمر التوقيف");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Find citizen name for displaying in notification
      const citizen = citizens.find(c => c.id === newWarrant.citizen_id);
      const citizenName = citizen ? citizen.name : "مواطن";
      
      // Add warrant to Supabase
      const { data, error } = await supabase
        .from('warrants')
        .insert({
          citizen_id: newWarrant.citizen_id,
          reason: newWarrant.reason,
          issue_date: newWarrant.issue_date,
          expiry_date: newWarrant.expiry_date,
          status: newWarrant.status,
          issuing_officer_id: user?.id || '00000000-0000-0000-0000-000000000000'
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform to Warrant type
        const newWarrantData: Warrant = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          citizen_name: citizenName,
          reason: data[0].reason,
          status: data[0].status as 'active' | 'executed' | 'expired',
          issue_date: data[0].issue_date,
          expiry_date: data[0].expiry_date,
          issuing_officer_id: data[0].issuing_officer_id,
          issuing_officer_name: user?.name || 'ضابط غير معروف',
          created_at: data[0].created_at
        };
        
        // Add notification
        await supabase.from('notifications').insert({
          title: 'أمر توقيف جديد',
          description: `تم إصدار أمر توقيف جديد بحق المواطن ${citizenName}`,
          read: false,
          type: 'warning',
          created_by: user?.id,
          related_to: data[0].id
        });
        
        onWarrantAdded(newWarrantData);
      }
      
      onOpenChange(false);
      
      // Reset form
      setNewWarrant({
        citizen_id: '',
        reason: '',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active' as 'active' | 'executed' | 'expired'
      });
      
      toast.success("تم إضافة أمر التوقيف بنجاح");
    } catch (error) {
      console.error('Error adding warrant:', error);
      toast.error("فشل في إضافة أمر التوقيف");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">إضافة أمر توقيف جديد</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="citizen">المواطن *</Label>
            <Select 
              value={newWarrant.citizen_id} 
              onValueChange={(value) => setNewWarrant({...newWarrant, citizen_id: value})}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">تاريخ الإصدار *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="issueDate"
                  type="date"
                  value={newWarrant.issue_date}
                  onChange={(e) => setNewWarrant({...newWarrant, issue_date: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiryDate"
                  type="date"
                  value={newWarrant.expiry_date}
                  onChange={(e) => setNewWarrant({...newWarrant, expiry_date: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">سبب أمر التوقيف *</Label>
            <Textarea
              id="reason"
              placeholder="أدخل سبب أمر التوقيف..."
              value={newWarrant.reason}
              onChange={(e) => setNewWarrant({...newWarrant, reason: e.target.value})}
              className="police-input min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select 
              value={newWarrant.status} 
              onValueChange={(value: 'active' | 'executed' | 'expired') => setNewWarrant({...newWarrant, status: value})}
            >
              <SelectTrigger id="status" className="police-input">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="executed">تم تنفيذه</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
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
            onClick={handleAddWarrant}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الإضافة...' : 'إضافة أمر التوقيف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWarrantDialog;
