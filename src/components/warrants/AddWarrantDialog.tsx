
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Warrant } from "@/types";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

interface CitizenOption {
  id: string;
  name: string;
}

interface AddWarrantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWarrantAdded: (warrant: Warrant) => void;
}

const AddWarrantDialog = ({ isOpen, onOpenChange, onWarrantAdded }: AddWarrantDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [citizens, setCitizens] = useState<CitizenOption[]>([]);
  const [isLoadingCitizens, setIsLoadingCitizens] = useState(true);
  
  // Form state
  const [warrant, setWarrant] = useState({
    citizen_id: '',
    reason: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    status: 'active' as 'active' | 'executed' | 'expired'
  });

  // Fetch citizens from Supabase
  useEffect(() => {
    const fetchCitizens = async () => {
      setIsLoadingCitizens(true);
      try {
        const { data, error } = await supabase
          .from('citizens')
          .select('id, first_name, last_name');
          
        if (error) throw error;
        
        const citizenOptions: CitizenOption[] = data.map(citizen => ({
          id: citizen.id,
          name: `${citizen.first_name} ${citizen.last_name}`
        }));
        
        setCitizens(citizenOptions);
      } catch (error) {
        console.error('Error fetching citizens:', error);
        toast.error('فشل في جلب بيانات المواطنين');
      } finally {
        setIsLoadingCitizens(false);
      }
    };
    
    if (isOpen) {
      fetchCitizens();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Validate input
    if (!warrant.citizen_id) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }
    
    if (!warrant.reason) {
      toast.error("الرجاء إدخال سبب الإيقاف");
      return;
    }
    
    const issueDate = new Date(warrant.issue_date);
    const expiryDate = new Date(warrant.expiry_date);
    
    if (expiryDate <= issueDate) {
      toast.error("يجب أن يكون تاريخ انتهاء الأمر بعد تاريخ إصداره");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add warrant to Supabase
      const { data, error } = await supabase
        .from('warrants')
        .insert({
          citizen_id: warrant.citizen_id,
          reason: warrant.reason,
          issue_date: warrant.issue_date,
          expiry_date: warrant.expiry_date,
          status: warrant.status,
          issuing_officer_id: user?.id
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get the citizen name
        const citizen = citizens.find(c => c.id === warrant.citizen_id);
        
        // Create new warrant object for state update
        const newWarrant: Warrant = {
          id: data[0].id,
          citizen_id: data[0].citizen_id,
          citizen_name: citizen ? citizen.name : 'مواطن غير معروف',
          reason: data[0].reason,
          issue_date: data[0].issue_date,
          expiry_date: data[0].expiry_date,
          status: data[0].status as 'active' | 'executed' | 'expired', // Fix type casting here
          issuing_officer_id: data[0].issuing_officer_id,
          issuing_officer_name: user?.name || 'ضابط غير معروف',
          created_at: data[0].created_at
        };
        
        // Update parent component state
        onWarrantAdded(newWarrant);
        
        // Add notification
        await supabase.from('notifications').insert({
          title: 'أمر توقيف جديد',
          description: `تم إصدار أمر توقيف جديد بحق ${newWarrant.citizen_name}`,
          read: false,
          type: 'warning',
          created_by: user?.id,
          related_to: data[0].id
        });
        
        // Reset form
        setWarrant({
          citizen_id: '',
          reason: '',
          issue_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
          status: 'active'
        });
        
        toast.success("تم إضافة أمر التوقيف بنجاح");
        
        // Close dialog
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error adding warrant:', error);
      toast.error("فشل في إضافة أمر التوقيف");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">إضافة أمر توقيف جديد</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="citizen">المواطن المطلوب</Label>
            <Select
              value={warrant.citizen_id}
              onValueChange={(value) => setWarrant({...warrant, citizen_id: value})}
              disabled={isLoadingCitizens}
            >
              <SelectTrigger className="police-input">
                <SelectValue placeholder={isLoadingCitizens ? "جاري التحميل..." : "اختر المواطن"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {citizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      {citizen.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">سبب أمر التوقيف</Label>
            <Textarea
              id="reason"
              placeholder="أدخل سبب إصدار أمر التوقيف..."
              value={warrant.reason}
              onChange={(e) => setWarrant({...warrant, reason: e.target.value})}
              className="police-input min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">تاريخ الإصدار</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  id="issueDate"
                  value={warrant.issue_date}
                  onChange={(e) => setWarrant({...warrant, issue_date: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  id="expiryDate"
                  value={warrant.expiry_date}
                  onChange={(e) => setWarrant({...warrant, expiry_date: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">حالة أمر التوقيف</Label>
            <Select
              value={warrant.status}
              onValueChange={(value: any) => setWarrant({...warrant, status: value})}
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
          
          <div className="flex items-center text-sm text-amber-500 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 ml-2" />
            <p>سيتم الإشارة إليك كضابط مسؤول عن إصدار أمر التوقيف</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button 
            className="police-button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingCitizens}
          >
            {isSubmitting ? "جاري الإضافة..." : "إضافة أمر التوقيف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWarrantDialog;
