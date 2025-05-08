
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  ClipboardList,
  Calendar,
  MapPin
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Mock data for citations
const mockCitations = [
  {
    id: '301',
    citizen_id: '1',
    citizen_name: 'أحمد السالم',
    violation: 'تجاوز السرعة',
    fine_amount: 500,
    date: '2023-06-12T14:30:00.000Z',
    location: 'طريق الملك فهد، الرياض',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    paid: false,
  },
  {
    id: '302',
    citizen_id: '1',
    citizen_name: 'أحمد السالم',
    violation: 'وقوف في مكان ممنوع',
    fine_amount: 200,
    date: '2023-08-03T09:15:00.000Z',
    location: 'شارع التحلية، جدة',
    officer_id: '2',
    officer_name: 'عبدالله خالد',
    paid: true,
  },
  {
    id: '303',
    citizen_id: '2',
    citizen_name: 'سارة العتيبي',
    violation: 'استخدام الهاتف أثناء القيادة',
    fine_amount: 300,
    date: '2023-09-15T11:45:00.000Z',
    location: 'طريق الأمير محمد بن سلمان، الرياض',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    paid: false,
  },
  {
    id: '304',
    citizen_id: '3',
    citizen_name: 'خالد المحمد',
    violation: 'عدم ربط حزام الأمان',
    fine_amount: 150,
    date: '2023-10-05T16:20:00.000Z',
    location: 'طريق الملك عبدالعزيز، الدمام',
    officer_id: '3',
    officer_name: 'محمد السعيد',
    paid: true,
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

// Common violations
const commonViolations = [
  "تجاوز السرعة",
  "وقوف في مكان ممنوع",
  "استخدام الهاتف أثناء القيادة",
  "عدم ربط حزام الأمان",
  "قطع الإشارة الحمراء",
  "قيادة مركبة بدون لوحات",
  "قيادة مركبة بلوحات غير مقروءة",
  "عدم حمل رخصة القيادة",
  "عدم حمل استمارة المركبة",
  "تجاوز خط السير",
];

const CitationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [citations, setCitations] = useState(mockCitations);
  const { user } = useAuth();
  
  // New citation form state
  const [newCitation, setNewCitation] = useState({
    citizen_id: '',
    violation: '',
    fine_amount: 300,
    date: new Date().toISOString().split('T')[0],
    location: '',
    paid: false,
  });

  // Filter citations based on search query
  const filteredCitations = searchQuery
    ? citations.filter(citation => 
        citation.citizen_name.includes(searchQuery) ||
        citation.violation.includes(searchQuery) ||
        citation.location.includes(searchQuery))
    : citations;

  const handleAddCitation = () => {
    // Validate input
    if (!newCitation.citizen_id) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!newCitation.violation) {
      toast.error("الرجاء إدخال المخالفة");
      return;
    }

    if (newCitation.fine_amount <= 0) {
      toast.error("الرجاء إدخال قيمة الغرامة بشكل صحيح");
      return;
    }

    if (!newCitation.location) {
      toast.error("الرجاء إدخال موقع المخالفة");
      return;
    }

    // Find citizen name
    const citizen = mockCitizens.find(c => c.id === newCitation.citizen_id);
    
    // Add new citation
    const newCitationComplete = {
      id: (citations.length + 1).toString(),
      citizen_id: newCitation.citizen_id,
      citizen_name: citizen ? citizen.name : 'مواطن غير معروف',
      violation: newCitation.violation,
      fine_amount: newCitation.fine_amount,
      date: new Date(newCitation.date).toISOString(),
      location: newCitation.location,
      officer_id: user?.id || '0',
      officer_name: user?.name || 'ضابط غير معروف',
      paid: newCitation.paid,
    };
    
    setCitations([newCitationComplete, ...citations]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewCitation({
      citizen_id: '',
      violation: '',
      fine_amount: 300,
      date: new Date().toISOString().split('T')[0],
      location: '',
      paid: false,
    });
    
    toast.success("تم إصدار المخالفة بنجاح");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ClipboardList className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">المخالفات المرورية</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إصدار مخالفة
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث باسم المواطن أو المخالفة..."
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
              <th>المخالفة</th>
              <th>الغرامة</th>
              <th>التاريخ</th>
              <th>الموقع</th>
              <th>الضابط المسؤول</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredCitations.map((citation) => (
              <tr key={citation.id} className="cursor-pointer">
                <td className="font-medium">{citation.citizen_name}</td>
                <td>{citation.violation}</td>
                <td>{citation.fine_amount} ريال</td>
                <td>{formatDate(citation.date)}</td>
                <td>{citation.location}</td>
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
            {filteredCitations.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  لا توجد مخالفات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Citation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إصدار مخالفة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن *</Label>
              <Select 
                value={newCitation.citizen_id} 
                onValueChange={(value) => setNewCitation({...newCitation, citizen_id: value})}
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
                <Label htmlFor="violation">المخالفة *</Label>
                <Select
                  value={newCitation.violation}
                  onValueChange={(value) => setNewCitation({...newCitation, violation: value})}
                >
                  <SelectTrigger id="violation" className="police-input">
                    <SelectValue placeholder="اختر المخالفة" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonViolations.map((violation) => (
                      <SelectItem key={violation} value={violation}>
                        {violation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fine_amount">قيمة الغرامة (ريال) *</Label>
                <Input
                  id="fine_amount"
                  type="number"
                  min={1}
                  value={newCitation.fine_amount}
                  onChange={(e) => setNewCitation({...newCitation, fine_amount: parseInt(e.target.value) || 0})}
                  className="police-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">تاريخ المخالفة *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={newCitation.date}
                    onChange={(e) => setNewCitation({...newCitation, date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">الموقع *</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="أدخل موقع المخالفة"
                    value={newCitation.location}
                    onChange={(e) => setNewCitation({...newCitation, location: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Label htmlFor="paid" className="flex-shrink-0">تم الدفع</Label>
              <Switch
                id="paid"
                checked={newCitation.paid}
                onCheckedChange={(checked) => setNewCitation({...newCitation, paid: checked})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddCitation}>
              إصدار المخالفة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CitationsPage;
