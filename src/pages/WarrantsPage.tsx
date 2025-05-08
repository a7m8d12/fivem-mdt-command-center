
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for warrants
const mockWarrants = [
  {
    id: '1',
    citizen_name: 'أحمد السالم',
    citizen_id: '1',
    reason: 'عدم الظهور في المحكمة',
    status: 'active',
    issue_date: '2025-04-20',
    expiry_date: '2025-07-20',
    issuing_officer_name: 'فهد العنزي',
    issuing_officer_id: '1',
  },
  {
    id: '2',
    citizen_name: 'خالد المحمد',
    citizen_id: '3',
    reason: 'عدم دفع غرامات مرورية متراكمة',
    status: 'active',
    issue_date: '2025-04-25',
    expiry_date: '2025-07-25',
    issuing_officer_name: 'عبدالله خالد',
    issuing_officer_id: '2',
  },
  {
    id: '3',
    citizen_name: 'سارة العتيبي',
    citizen_id: '2',
    reason: 'مخالفة شروط الإفراج المشروط',
    status: 'expired',
    issue_date: '2025-01-10',
    expiry_date: '2025-04-10',
    issuing_officer_name: 'فهد العنزي',
    issuing_officer_id: '1',
  }
];

// Mock citizens data
const mockCitizens = [
  { id: '1', name: 'أحمد السالم' },
  { id: '2', name: 'سارة العتيبي' },
  { id: '3', name: 'خالد المحمد' },
  { id: '4', name: 'منى الحربي' },
  { id: '5', name: 'عبدالله القحطاني' },
];

const WarrantsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [warrants, setWarrants] = useState(mockWarrants);
  const { user } = useAuth();
  
  // New warrant form state
  const [newWarrant, setNewWarrant] = useState({
    citizen_id: '',
    reason: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
  });

  // Filter warrants based on search query
  const filteredWarrants = searchQuery
    ? warrants.filter(warrant => 
        warrant.citizen_name.includes(searchQuery) ||
        warrant.reason.includes(searchQuery))
    : warrants;

  const getStatusBadge = (status: string) => {
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

  const handleAddWarrant = () => {
    // Validate input
    if (!newWarrant.citizen_id) {
      toast.error("الرجاء اختيار مواطن");
      return;
    }

    if (!newWarrant.reason) {
      toast.error("الرجاء إدخال سبب أمر التوقيف");
      return;
    }

    // Find citizen name
    const citizen = mockCitizens.find(c => c.id === newWarrant.citizen_id);
    
    // Add new warrant
    const newWarrantComplete = {
      id: (warrants.length + 1).toString(),
      citizen_name: citizen ? citizen.name : 'مواطن غير معروف',
      citizen_id: newWarrant.citizen_id,
      reason: newWarrant.reason,
      status: 'active',
      issue_date: newWarrant.issue_date,
      expiry_date: newWarrant.expiry_date,
      issuing_officer_name: user?.name || 'ضابط غير معروف',
      issuing_officer_id: user?.id || '0',
    };
    
    setWarrants([newWarrantComplete, ...warrants]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewWarrant({
      citizen_id: '',
      reason: '',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    
    toast.success("تم إضافة أمر التوقيف بنجاح");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">أوامر التوقيف</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة أمر توقيف
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن أمر توقيف..."
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
              <th>سبب أمر التوقيف</th>
              <th>تاريخ الإصدار</th>
              <th>تاريخ الانتهاء</th>
              <th>الضابط المسؤول</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarrants.map((warrant) => (
              <tr key={warrant.id} className="cursor-pointer">
                <td className="font-medium">{warrant.citizen_name}</td>
                <td>{warrant.reason}</td>
                <td>{formatDate(warrant.issue_date)}</td>
                <td>{formatDate(warrant.expiry_date)}</td>
                <td>{warrant.issuing_officer_name}</td>
                <td>{getStatusBadge(warrant.status)}</td>
              </tr>
            ))}
            {filteredWarrants.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  لا توجد أوامر توقيف مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Warrant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddWarrant}>
              إضافة أمر التوقيف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarrantsPage;
