
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  UserX, 
  Car,
  FileText,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface CitizenDetailsTabsProps {
  citizenId: string;
  formatDate: (date: string) => string;
}

const CitizenDetailsTabs = ({ citizenId, formatDate }: CitizenDetailsTabsProps) => {
  const [criminalRecords, setCriminalRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [arrestReports, setArrestReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('criminal');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTabData = async () => {
      setIsLoading(true);
      
      if (activeTab === 'criminal') {
        try {
          const { data, error } = await supabase
            .from('criminal_records')
            .select(`
              *,
              profiles:officer_id (name)
            `)
            .eq('citizen_id', citizenId);
            
          if (error) {
            throw error;
          }
          
          const records = data.map((record: any) => ({
            id: record.id,
            citizen_id: record.citizen_id,
            offense: record.offense,
            description: record.description,
            date: record.date,
            officer_id: record.officer_id,
            officer_name: record.profiles?.name || 'ضابط غير معروف',
            status: record.status || 'active',
            created_at: record.created_at,
          }));

          setCriminalRecords(records);
        } catch (error) {
          console.error('Error fetching criminal records:', error);
          toast.error('فشل في جلب السجلات الجنائية');
        }
      } else if (activeTab === 'vehicles') {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('citizen_id', citizenId);
            
          if (error) {
            throw error;
          }
          
          setVehicles(data);
        } catch (error) {
          console.error('Error fetching vehicles:', error);
          toast.error('فشل في جلب المركبات');
        }
      } else if (activeTab === 'citations') {
        try {
          const { data, error } = await supabase
            .from('citations')
            .select(`
              *,
              profiles:officer_id (name)
            `)
            .eq('citizen_id', citizenId);
            
          if (error) {
            throw error;
          }
          
          const citationsData = data.map((citation: any) => ({
            id: citation.id,
            citizen_id: citation.citizen_id,
            violation: citation.violation,
            fine_amount: citation.fine_amount,
            date: citation.date,
            location: citation.location,
            officer_id: citation.officer_id,
            officer_name: citation.profiles?.name || 'ضابط غير معروف',
            paid: citation.paid,
            created_at: citation.created_at,
          }));

          setCitations(citationsData);
        } catch (error) {
          console.error('Error fetching citations:', error);
          toast.error('فشل في جلب المخالفات');
        }
      } else if (activeTab === 'reports') {
        try {
          const { data, error } = await supabase
            .from('arrest_reports')
            .select(`
              *,
              profiles:officer_id (name)
            `)
            .eq('citizen_id', citizenId);
            
          if (error) {
            throw error;
          }
          
          const reportsData = data.map((report: any) => ({
            id: report.id,
            citizen_id: report.citizen_id,
            officer_id: report.officer_id,
            officer_name: report.profiles?.name || 'ضابط غير معروف',
            charges: report.charges,
            narrative: report.narrative,
            arrest_date: report.arrest_date,
            location: report.location,
            created_at: report.created_at,
          }));

          setArrestReports(reportsData);
        } catch (error) {
          console.error('Error fetching arrest reports:', error);
          toast.error('فشل في جلب تقارير الاعتقال');
        }
      }
      
      setIsLoading(false);
    };
    
    loadTabData();
  }, [activeTab, citizenId]);

  return (
    <Tabs defaultValue="criminal" onValueChange={(value) => setActiveTab(value)}>
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="criminal" className="flex items-center">
          <UserX className="ml-2 h-4 w-4" /> السجل الجنائي
        </TabsTrigger>
        <TabsTrigger value="vehicles" className="flex items-center">
          <Car className="ml-2 h-4 w-4" /> المركبات
        </TabsTrigger>
        <TabsTrigger value="citations" className="flex items-center">
          <ClipboardList className="ml-2 h-4 w-4" /> المخالفات
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center">
          <FileText className="ml-2 h-4 w-4" /> التقارير
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="criminal" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">السجل الجنائي</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : criminalRecords.length > 0 ? (
            <div className="border border-border/50 rounded-md overflow-hidden">
              <table className="police-table">
                <thead>
                  <tr>
                    <th>المخالفة</th>
                    <th>التاريخ</th>
                    <th>الضابط المسؤول</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {criminalRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="font-medium">{record.offense}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.officer_name}</td>
                      <td>
                        {record.status === 'active' && <Badge className="badge-red">نشطة</Badge>}
                        {record.status === 'completed' && <Badge className="badge-green">مكتملة</Badge>}
                        {record.status === 'dismissed' && <Badge className="badge-blue">ملغاة</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا يوجد سجل جنائي لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="vehicles" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">المركبات</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : vehicles.length > 0 ? (
            <div className="border border-border/50 rounded-md overflow-hidden">
              <table className="police-table">
                <thead>
                  <tr>
                    <th>رقم اللوحة</th>
                    <th>الموديل</th>
                    <th>اللون</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="font-medium" dir="ltr">{vehicle.plate}</td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.color}</td>
                      <td>
                        {vehicle.stolen ? (
                          <Badge className="badge-red">مسروقة</Badge>
                        ) : vehicle.registered ? (
                          <Badge className="badge-green">مسجلة</Badge>
                        ) : (
                          <Badge className="badge-yellow">غير مسجلة</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد مركبات مسجلة لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="citations" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">المخالفات المرورية</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : citations.length > 0 ? (
            <div className="border border-border/50 rounded-md overflow-hidden">
              <table className="police-table">
                <thead>
                  <tr>
                    <th>المخالفة</th>
                    <th>الغرامة</th>
                    <th>التاريخ</th>
                    <th>الضابط المسؤول</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {citations.map((citation) => (
                    <tr key={citation.id}>
                      <td className="font-medium">{citation.violation}</td>
                      <td>{citation.fine_amount} دينار عراقي</td>
                      <td>{formatDate(citation.date)}</td>
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
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد مخالفات مرورية لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="reports" className="mt-4">
        <div className="police-card p-4">
          <h3 className="text-lg font-semibold mb-4">تقارير الاعتقال</h3>
          
          {isLoading ? (
            <div className="text-center py-6">
              جاري تحميل البيانات...
            </div>
          ) : arrestReports.length > 0 ? (
            <div className="space-y-4">
              {arrestReports.map((report) => (
                <div key={report.id} className="border border-border/50 rounded-md p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold">تقرير اعتقال</h4>
                      <p className="text-sm text-muted-foreground">
                        بتاريخ {formatDate(report.arrest_date)} - الضابط: {report.officer_name}
                      </p>
                    </div>
                    <Badge className="badge-red">اعتقال</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">التهم:</h5>
                      <div className="flex flex-wrap gap-2">
                        {report.charges && report.charges.map((charge: string, index: number) => (
                          <Badge key={index} variant="outline">{charge}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-1">المكان:</h5>
                      <p className="text-sm bg-secondary/50 p-2 rounded-md">
                        {report.location}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-1">تفاصيل الاعتقال:</h5>
                      <p className="text-sm bg-secondary/50 p-2 rounded-md whitespace-pre-line">
                        {report.narrative}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد تقارير اعتقال لهذا المواطن
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default CitizenDetailsTabs;
