
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Warrant } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

interface AddWarrantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onWarrantAdded: (warrant: Warrant) => void;
}

const AddWarrantDialog = ({ isOpen, onOpenChange, onWarrantAdded }: AddWarrantDialogProps) => {
  const [citizenId, setCitizenId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  });
  const [status, setStatus] = useState<'active' | 'executed' | 'expired'>('active');
  
  const [citizens, setCitizens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { user } = useAuth();
  
  // Fetch citizens for dropdown
  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const { data, error } = await supabase
          .from('citizens')
          .select('id, first_name, last_name')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setCitizens(data || []);
      } catch (error) {
        console.error('Error fetching citizens:', error);
        toast.error('فشل في جلب بيانات المواطنين');
      }
    };
    
    if (isOpen) {
      fetchCitizens();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!citizenId) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!reason) {
      toast.error("الرجاء إدخال سبب أمر التوقيف");
      return;
    }

    if (!issueDate) {
      toast.error("الرجاء تحديد تاريخ الإصدار");
      return;
    }

    if (!expiryDate) {
      toast.error("الرجاء تحديد تاريخ الانتهاء");
      return;
    }

    setIsLoading(true);
    
    try {
      const issueFormattedDate = format(issueDate, 'yyyy-MM-dd');
      const expiryFormattedDate = format(expiryDate, 'yyyy-MM-dd');
      
      // Insert into warrants table
      const { data, error } = await supabase
        .from('warrants')
        .insert({
          citizen_id: citizenId,
          reason,
          issue_date: issueFormattedDate,
          expiry_date: expiryFormattedDate,
          status: status as 'active' | 'executed' | 'expired',
          issuing_officer_id: user?.id
        })
        .select();
      
      if (error) throw error;
      
      // Find the citizen name
      const citizen = citizens.find(c => c.id === citizenId);
      const citizenName = citizen ? `${citizen.first_name} ${citizen.last_name}` : 'مواطن غير معروف';
      
      // Create the warrant object to add to the UI
      const newWarrant: Warrant = {
        id: data[0].id,
        citizen_id: citizenId,
        citizen_name: citizenName,
        reason,
        status: status as 'active' | 'executed' | 'expired',
        issue_date: issueFormattedDate,
        expiry_date: expiryFormattedDate,
        issuing_officer_id: user?.id || '',
        issuing_officer_name: user?.name || '',
        created_at: new Date().toISOString()
      };
      
      // Add notification
      await supabase.from('notifications').insert({
        title: 'إصدار أمر توقيف جديد',
        description: `تم إصدار أمر توقيف جديد بحق المواطن ${citizenName}`,
        read: false,
        type: 'warning',
        created_by: user?.id,
        related_to: data[0].id
      });
      
      onWarrantAdded(newWarrant);
      resetForm();
      onOpenChange(false);
      toast.success("تم إضافة أمر التوقيف بنجاح");
    } catch (error) {
      console.error('Error adding warrant:', error);
      toast.error("فشل في إضافة أمر التوقيف");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCitizenId('');
    setReason('');
    setIssueDate(new Date());
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    setExpiryDate(defaultExpiry);
    setStatus('active');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">إضافة أمر توقيف جديد</DialogTitle>
          <DialogDescription className="text-center">أدخل معلومات أمر التوقيف</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="citizen">المواطن *</Label>
            <Select 
              value={citizenId} 
              onValueChange={setCitizenId}
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
            <Label htmlFor="reason">سبب أمر التوقيف *</Label>
            <Textarea
              id="reason"
              placeholder="أدخل سبب أمر التوقيف هنا..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="police-input min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الإصدار *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="police-input w-full justify-start text-right"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {issueDate ? format(issueDate, 'PPP', { locale: ar }) : <span>اختر التاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(date) => date && setIssueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>تاريخ الانتهاء *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="police-input w-full justify-start text-right"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'PPP', { locale: ar }) : <span>اختر التاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={(date) => date && setExpiryDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">الحالة *</Label>
            <Select 
              value={status} 
              onValueChange={(value) => setStatus(value as 'active' | 'executed' | 'expired')}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} className="police-button" disabled={isLoading}>
            {isLoading ? "جاري الإضافة..." : "إضافة أمر التوقيف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWarrantDialog;
