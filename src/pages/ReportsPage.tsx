
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  FileText,
  Filter,
  Download,
  Pencil,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface Report {
  id: string;
  report_number: string;
  title: string;
  type: 'arrest' | 'incident' | 'investigation' | 'traffic';
  officer_name: string;
  status: 'open' | 'closed' | 'pending';
  date: string;
  created_at: string;
}

const ReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch reports from Supabase
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        // For this example, we'll still use mock data since reports table might not exist yet
        // In a real implementation, this would fetch from Supabase
        setReports([
          {
            id: '1',
            report_number: 'AR-2023-001',
            title: 'اعتقال - قيادة تحت تأثير المخدرات',
            type: 'arrest',
            officer_name: 'فهد العنزي',
            status: 'closed',
            date: '2023-07-22T16:45:00.000Z',
            created_at: '2023-07-22T18:30:00.000Z',
          },
          {
            id: '2',
            report_number: 'IR-2023-042',
            title: 'حادث مروري - طريق الملك فهد',
            type: 'incident',
            officer_name: 'محمد العلي',
            status: 'open',
            date: '2023-08-15T09:20:00.000Z',
            created_at: '2023-08-15T10:30:00.000Z',
          },
          {
            id: '3',
            report_number: 'INV-2023-018',
            title: 'تحقيق في سرقة مركبة',
            type: 'investigation',
            officer_name: 'عبدالله خالد',
            status: 'pending',
            date: '2023-08-03T14:10:00.000Z',
            created_at: '2023-08-03T15:45:00.000Z',
          },
          {
            id: '4',
            report_number: 'TR-2023-076',
            title: 'مخالفة مرورية - تجاوز الإشارة الحمراء',
            type: 'traffic',
            officer_name: 'خالد العبيد',
            status: 'closed',
            date: '2023-08-10T11:30:00.000Z',
            created_at: '2023-08-10T12:15:00.000Z',
          },
          {
            id: '5',
            report_number: 'AR-2023-002',
            title: 'اعتقال - حيازة ممنوعات',
            type: 'arrest',
            officer_name: 'فهد العنزي',
            status: 'open',
            date: '2023-08-18T13:40:00.000Z',
            created_at: '2023-08-18T14:50:00.000Z',
          },
        ]);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('حدث خطأ أثناء جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  const filteredReports = reports
    .filter((report) => 
      (searchQuery === '' || 
        report.title.includes(searchQuery) ||
        report.report_number.includes(searchQuery))
    )
    .filter((report) => typeFilter === 'all' || report.type === typeFilter)
    .filter((report) => statusFilter === 'all' || report.status === statusFilter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'arrest':
        return <Badge className="badge-red">اعتقال</Badge>;
      case 'incident':
        return <Badge className="badge-yellow">حادث</Badge>;
      case 'investigation':
        return <Badge className="badge-blue">تحقيق</Badge>;
      case 'traffic':
        return <Badge className="badge-green">مرور</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="badge-blue">مفتوح</Badge>;
      case 'closed':
        return <Badge className="badge-green">مغلق</Badge>;
      case 'pending':
        return <Badge className="badge-yellow">قيد المتابعة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const handleEditClick = (reportId: string) => {
    navigate(`/reports/edit/${reportId}`);
  };
  
  const handleDeleteClick = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteReport = async () => {
    if (!selectedReportId) return;
    
    try {
      // In a real implementation, this would delete from Supabase
      // Since we're using mock data for now, just remove from local state
      setReports(reports.filter(report => report.id !== selectedReportId));
      setIsDeleteDialogOpen(false);
      toast.success('تم حذف التقرير بنجاح');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('حدث خطأ أثناء حذف التقرير');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">التقارير</h2>
        <Button className="police-button" onClick={() => navigate('/reports/create')}>
          <Plus className="ml-2 h-4 w-4" /> إنشاء تقرير جديد
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="بحث عن تقرير..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="police-input pr-10"
            />
          </div>
        </div>
        
        <div className="relative">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="police-input">
              <div className="flex items-center">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue placeholder="نوع التقرير" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="arrest">تقرير اعتقال</SelectItem>
              <SelectItem value="incident">تقرير حادث</SelectItem>
              <SelectItem value="investigation">تقرير تحقيق</SelectItem>
              <SelectItem value="traffic">تقرير مروري</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="police-input">
              <div className="flex items-center">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue placeholder="حالة التقرير" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="open">مفتوح</SelectItem>
              <SelectItem value="closed">مغلق</SelectItem>
              <SelectItem value="pending">قيد المتابعة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border border-border/50 rounded-md overflow-hidden">
        <table className="police-table">
          <thead>
            <tr>
              <th className="w-1/6">رقم التقرير</th>
              <th className="w-2/6">العنوان</th>
              <th className="w-1/6">النوع</th>
              <th className="w-1/6">الضابط</th>
              <th className="w-1/6">التاريخ</th>
              <th className="w-1/6">الحالة</th>
              <th className="w-1/6">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="font-medium">{report.report_number}</td>
                  <td>{report.title}</td>
                  <td>{getTypeBadge(report.type)}</td>
                  <td>{report.officer_name}</td>
                  <td>{formatDate(report.date)}</td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/reports/${report.id}`)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(report.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  لا توجد تقارير مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا التقرير؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReportsPage;
