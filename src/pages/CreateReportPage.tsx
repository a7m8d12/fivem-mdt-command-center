
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Search, FileText } from 'lucide-react';

interface CitizenOption {
  id: string;
  name: string;
}

// Mock data
const mockCitizens: CitizenOption[] = [
  { id: '1', name: 'أحمد السالم' },
  { id: '2', name: 'سارة العتيبي' },
  { id: '3', name: 'خالد المحمد' },
  { id: '4', name: 'منى الحربي' },
  { id: '5', name: 'عبدالله القحطاني' },
];

const CreateReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportType, setReportType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [citizenId, setCitizenId] = useState<string>('');
  const [citizenSearch, setCitizenSearch] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [charges, setCharges] = useState<{ id: number; text: string; checked: boolean }[]>([
    { id: 1, text: 'قيادة بتهور', checked: false },
    { id: 2, text: 'قيادة تحت تأثير المخدرات', checked: false },
    { id: 3, text: 'تجاوز السرعة المسموح بها', checked: false },
    { id: 4, text: 'مخالفة أنظمة المرور', checked: false },
    { id: 5, text: 'حيازة مواد ممنوعة', checked: false },
    { id: 6, text: 'مقاومة رجال الأمن', checked: false },
    { id: 7, text: 'اخلال بالأمن العام', checked: false },
  ]);

  const filteredCitizens = citizenSearch
    ? mockCitizens.filter(citizen => citizen.name.includes(citizenSearch))
    : mockCitizens;

  const handleChargeChange = (id: number, checked: boolean) => {
    setCharges(charges.map(charge => 
      charge.id === id ? { ...charge, checked } : charge
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      toast.error("الرجاء إدخال عنوان التقرير");
      return;
    }

    if (!citizenId) {
      toast.error("الرجاء اختيار المواطن");
      return;
    }

    if (!reportType) {
      toast.error("الرجاء اختيار نوع التقرير");
      return;
    }

    if (!location.trim()) {
      toast.error("الرجاء إدخال الموقع");
      return;
    }

    if (!description.trim()) {
      toast.error("الرجاء إدخال وصف للتقرير");
      return;
    }

    if (reportType === 'arrest' && !charges.some(charge => charge.checked)) {
      toast.error("الرجاء اختيار تهمة واحدة على الأقل للاعتقال");
      return;
    }

    // Mock report submission
    toast.success("تم إنشاء التقرير بنجاح");
    navigate('/reports');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <FileText className="ml-2 h-5 w-5 text-police-blue" />
        <h2 className="text-2xl font-bold">إنشاء تقرير جديد</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="police-card p-6">
          <h3 className="text-lg font-semibold mb-4">معلومات أساسية</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportType">نوع التقرير *</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType" className="police-input">
                    <SelectValue placeholder="اختر نوع التقرير" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arrest">تقرير اعتقال</SelectItem>
                    <SelectItem value="incident">تقرير حادث</SelectItem>
                    <SelectItem value="investigation">تقرير تحقيق</SelectItem>
                    <SelectItem value="traffic">تقرير مروري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">عنوان التقرير *</Label>
                <Input
                  id="title"
                  placeholder="أدخل عنوان التقرير"
                  className="police-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="citizen">المواطن المعني *</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث عن مواطن..."
                    className="police-input pr-10 mb-2"
                    value={citizenSearch}
                    onChange={(e) => setCitizenSearch(e.target.value)}
                  />
                  <Select value={citizenId} onValueChange={setCitizenId}>
                    <SelectTrigger id="citizen" className="police-input">
                      <SelectValue placeholder="اختر المواطن" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCitizens.map((citizen) => (
                        <SelectItem key={citizen.id} value={citizen.id}>
                          {citizen.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="officer">الضابط المسؤول</Label>
                <Input
                  id="officer"
                  className="police-input"
                  value={`${user?.name} #${user?.badge_number}`}
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">الموقع *</Label>
                <Input
                  id="location"
                  placeholder="أدخل موقع الحادث/الواقعة"
                  className="police-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  className="police-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {reportType === 'arrest' && (
          <div className="police-card p-6">
            <h3 className="text-lg font-semibold mb-4">تهم الاعتقال</h3>
            <div className="space-y-3">
              {charges.map(charge => (
                <div key={charge.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox 
                    id={`charge-${charge.id}`} 
                    checked={charge.checked}
                    onCheckedChange={(checked) => handleChargeChange(charge.id, !!checked)}
                  />
                  <Label htmlFor={`charge-${charge.id}`} className="text-sm">
                    {charge.text}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="police-card p-6">
          <h3 className="text-lg font-semibold mb-4">تفاصيل التقرير</h3>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              placeholder="أدخل تفاصيل التقرير..."
              className="police-input min-h-[200px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 rtl:space-x-reverse">
          <Button type="button" variant="outline" onClick={() => navigate('/reports')}>
            إلغاء
          </Button>
          <Button type="submit" className="police-button">
            حفظ التقرير
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateReportPage;
