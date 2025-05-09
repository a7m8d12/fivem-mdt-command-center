
import React from 'react';
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
  DialogFooter
} from "@/components/ui/dialog";
import { Warrant } from '@/types';

interface EditWarrantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editWarrant: {
    id: string;
    citizen_id: string;
    reason: string;
    issue_date: string;
    expiry_date: string;
    status: 'active' | 'executed' | 'expired';
  };
  setEditWarrant: React.Dispatch<React.SetStateAction<{
    id: string;
    citizen_id: string;
    reason: string;
    issue_date: string;
    expiry_date: string;
    status: 'active' | 'executed' | 'expired';
  }>>;
  handleEditWarrant: () => Promise<void>;
  isSubmitting: boolean;
}

const EditWarrantDialog = ({ 
  isOpen, 
  onOpenChange,
  editWarrant,
  setEditWarrant,
  handleEditWarrant,
  isSubmitting
}: EditWarrantDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تعديل أمر التوقيف</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editIssueDate">تاريخ الإصدار *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="editIssueDate"
                  type="date"
                  value={editWarrant.issue_date}
                  onChange={(e) => setEditWarrant({...editWarrant, issue_date: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editExpiryDate">تاريخ الانتهاء *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="editExpiryDate"
                  type="date"
                  value={editWarrant.expiry_date}
                  onChange={(e) => setEditWarrant({...editWarrant, expiry_date: e.target.value})}
                  className="police-input pr-10"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editReason">سبب أمر التوقيف *</Label>
            <Textarea
              id="editReason"
              placeholder="أدخل سبب أمر التوقيف..."
              value={editWarrant.reason}
              onChange={(e) => setEditWarrant({...editWarrant, reason: e.target.value})}
              className="police-input min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editStatus">الحالة</Label>
            <Select 
              value={editWarrant.status} 
              onValueChange={(value: 'active' | 'executed' | 'expired') => setEditWarrant({...editWarrant, status: value})}
            >
              <SelectTrigger id="editStatus" className="police-input">
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
            onClick={handleEditWarrant}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWarrantDialog;
