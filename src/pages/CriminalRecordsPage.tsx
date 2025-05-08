
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  UserX,
  Calendar
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
import { Textarea } from "@/components/ui/textarea";

// Mock data for criminal records
const mockRecords = [
  {
    id: '101',
    citizen_id: '1',
    citizen_name: 'أحمد السالم',
    offense: 'قيادة بتهور',
    description: 'تم ضبط المتهم يقود بسرعة 160 كم/س في منطقة سكنية',
    date: '2023-06-12T14:30:00.000Z',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    status: 'active',
  },
  {
    id: '102',
    citizen_id: '1',
    citizen_name: 'أحمد السالم',
    offense: 'مخالفة نظام المرور',
    description: 'قطع الإشارة الحمراء وتجاوز السرعة المسموح بها',
    date: '2023-08-03T09:15:00.000Z',
    officer_id: '2',
    officer_name: 'عبدالله خالد',
    status: 'completed',
  },
  {
    id: '103',
    citizen_id: '3',
    citizen_name: 'خالد المحمد',
    offense: 'حيازة ممنوعات',
    description: 'تم ضبط المتهم بحوزته مواد ممنوعة',
    date: '2023-07-22T16:45:00.000Z',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    status: 'active',
  },
  {
    id: '104',
    citizen_id: '2',
    citizen_name: 'سارة العتيبي',
    offense: 'اخلال بالأمن العام',
    description: 'تسببت في إزعاج عام وإثارة الفوضى',
    date: '2023-09-10T20:30:00.000Z',
    officer_id: '3',
    officer_name: 'محمد السعيد',
    status: 'dismissed',
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

// Common offenses
const commonOffenses = [
  "قيادة بتهور",
  "قيادة تحت تأثير المخدرات",
  "تجاوز السرعة المسموح بها",
  "مخالفة أنظمة المرور",
  "حيازة مواد ممنوعة",
  "مقاومة رجال الأمن",
  "اخلال بالأمن العام",
  "سرقة",
  "اعتداء",
  "تخريب ممتلكات عامة",
];

const CriminalRecordsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [records, setRecords] = useState(mockRecords);
  const { user } = useAuth();
  
  // New record form state
  const [newRecord, setNewRecord] = useState({
    citizen_id: '',
    offense: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  // Filter records based on search query
  const filteredRecords = searchQuery
    ? records.filter(record => 
        record.citizen_name.includes(searchQuery) ||
        record.offense.includes(searchQuery))
    : records;

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="badge-red">نشطة</Badge>;
    } else if (status === 'completed') {
      return <Badge className="badge-green">مكتملة</Badge>;
    } else if (status === 'dismissed') {
      return <Badge className="badge-blue">ملغاة</Badge>;
    } else {
      return <Badge>{status}</Badge>;
    }
  };

  const handleAddRecord = () => {
    // Validate input
    if (!newRecord.citizen_id) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!newRecord.offense) {
      toast.error("الرجاء إدخال المخالفة");
      return;
    }

    // Find citizen name
    const citizen = mockCitizens.find(c => c.id === newRecord.citizen_id);
    
    // Add new record
    const newRecordComplete = {
      id: (records.length + 1).toString(),
      citizen_id: newRecord.citizen_id,
      citizen_name: citizen ? citizen.name : 'مواطن غير معروف',
      offense: newRecord.offense,
      description: newRecord.description,
      date: new Date(newRecord.date).toISOString(),
      officer_id: user?.id || '0',
      officer_name: user?.name || 'ضابط غير معروف',
      status: newRecord.status,
    };
    
    setRecords([newRecordComplete, ...records]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewRecord({
      citizen_id: '',
      offense: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    
    toast.success("تم إضافة السجل الجنائي بنجاح");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserX className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">السجلات الجنائية</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة سجل جنائي
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
              <th>التاريخ</th>
              <th>الضابط المسؤول</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="cursor-pointer">
                <td className="font-medium">{record.citizen_name}</td>
                <td>{record.offense}</td>
                <td>{formatDate(record.date)}</td>
                <td>{record.officer_name}</td>
                <td>{getStatusBadge(record.status)}</td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted-foreground">
                  لا توجد سجلات جنائية مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">إضافة سجل جنائي جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="citizen">المواطن *</Label>
              <Select 
                value={newRecord.citizen_id} 
                onValueChange={(value) => setNewRecord({...newRecord, citizen_id: value})}
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
                <Label htmlFor="offense">المخالفة *</Label>
                <Select
                  value={newRecord.offense}
                  onValueChange={(value) => setNewRecord({...newRecord, offense: value})}
                >
                  <SelectTrigger id="offense" className="police-input">
                    <SelectValue placeholder="اختر المخالفة" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonOffenses.map((offense) => (
                      <SelectItem key={offense} value={offense}>
                        {offense}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">تاريخ المخالفة *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="police-input pr-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="أدخل وصفاً تفصيلياً للمخالفة..."
                value={newRecord.description}
                onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                className="police-input min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select 
                value={newRecord.status} 
                onValueChange={(value: string) => setNewRecord({...newRecord, status: value})}
              >
                <SelectTrigger id="status" className="police-input">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="dismissed">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button className="police-button" onClick={handleAddRecord}>
              إضافة السجل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CriminalRecordsPage;
