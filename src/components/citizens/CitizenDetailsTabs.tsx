
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { CriminalRecord, Citation, ArrestReport, Vehicle, Warrant } from '@/types';

interface CitizenDetailsTabsProps {
  citizenId: string;
  formatDate: (date: string) => string;
}

const CitizenDetailsTabs = ({ citizenId, formatDate }: CitizenDetailsTabsProps) => {
  const [activeTab, setActiveTab] = useState('criminal-records');
  const [criminalRecords, setCriminalRecords] = useState<CriminalRecord[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [arrestReports, setArrestReports] = useState<ArrestReport[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, citizenId]);

  const loadTabData = async (tab: string) => {
    setIsLoading(true);
    
    switch (tab) {
      case 'criminal-records':
        try {
          // Fetch criminal records
          const { data: recordsData, error: recordsError } = await supabase
            .from('criminal_records')
            .select('*')
            .eq('citizen_id', citizenId);

          if (recordsError) throw recordsError;

          if (recordsData) {
            // Fetch officer names for each criminal record
            const officerIds = recordsData.map((record: any) => record.officer_id).filter(Boolean);
            const uniqueOfficerIds = [...new Set(officerIds)];
            
            let officerMap = new Map();
            if (uniqueOfficerIds.length > 0) {
              const { data: officersData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', uniqueOfficerIds);
              
              if (officersData) {
                officersData.forEach((officer: any) => {
                  officerMap.set(officer.id, officer.name);
                });
              }
            }
            
            // Transform data
            const transformedRecords: CriminalRecord[] = recordsData.map((record: any) => ({
              id: record.id,
              citizen_id: record.citizen_id,
              offense: record.offense,
              description: record.description || '',
              date: record.date,
              officer_id: record.officer_id,
              officer_name: officerMap.get(record.officer_id) || 'ضابط غير معروف',
              status: record.status as 'active' | 'completed' | 'dismissed',
              created_at: record.created_at
            }));
            
            setCriminalRecords(transformedRecords);
          }
        } catch (error) {
          console.error('Error fetching criminal records:', error);
          toast.error('فشل في جلب السجلات الجنائية');
        } finally {
          setIsLoading(false);
        }
        break;
        
      case 'citations':
        try {
          // Fetch citations
          const { data: citationsData, error: citationsError } = await supabase
            .from('citations')
            .select('*')
            .eq('citizen_id', citizenId);
            
          if (citationsError) throw citationsError;

          if (citationsData) {
            // Fetch officer names
            const officerIds = citationsData.map((citation: any) => citation.officer_id).filter(Boolean);
            const uniqueOfficerIds = [...new Set(officerIds)];
            
            let officerMap = new Map();
            if (uniqueOfficerIds.length > 0) {
              const { data: officersData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', uniqueOfficerIds);
              
              if (officersData) {
                officersData.forEach((officer: any) => {
                  officerMap.set(officer.id, officer.name);
                });
              }
            }
            
            // Get citizen name
            const { data: citizenData } = await supabase
              .from('citizens')
              .select('first_name, last_name')
              .eq('id', citizenId)
              .single();
            
            const citizenName = citizenData ? `${citizenData.first_name} ${citizenData.last_name}` : 'مواطن غير معروف';
            
            // Transform data
            const transformedCitations: Citation[] = citationsData.map((citation: any) => ({
              id: citation.id,
              citizen_id: citation.citizen_id,
              citizen_name: citizenName,
              violation: citation.violation,
              fine_amount: citation.fine_amount,
              date: citation.date,
              location: citation.location || '',
              officer_id: citation.officer_id,
              officer_name: officerMap.get(citation.officer_id) || 'ضابط غير معروف',
              paid: citation.paid || false,
              created_at: citation.created_at
            }));
            
            setCitations(transformedCitations);
          }
        } catch (error) {
          console.error('Error fetching citations:', error);
          toast.error('فشل في جلب المخالفات');
        } finally {
          setIsLoading(false);
        }
        break;
        
      case 'arrest-reports':
        try {
          // Fetch arrest reports
          const { data: reportsData, error: reportsError } = await supabase
            .from('arrest_reports')
            .select('*')
            .eq('citizen_id', citizenId);
            
          if (reportsError) throw reportsError;

          if (reportsData) {
            // Fetch officer names
            const officerIds = reportsData.map((report: any) => report.officer_id).filter(Boolean);
            const uniqueOfficerIds = [...new Set(officerIds)];
            
            let officerMap = new Map();
            if (uniqueOfficerIds.length > 0) {
              const { data: officersData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', uniqueOfficerIds);
              
              if (officersData) {
                officersData.forEach((officer: any) => {
                  officerMap.set(officer.id, officer.name);
                });
              }
            }
            
            // Transform data
            const transformedReports: ArrestReport[] = reportsData.map((report: any) => ({
              id: report.id,
              citizen_id: report.citizen_id,
              officer_id: report.officer_id,
              officer_name: officerMap.get(report.officer_id) || 'ضابط غير معروف',
              charges: report.charges || [],
              narrative: report.narrative || '',
              arrest_date: report.arrest_date,
              location: report.location || '',
              created_at: report.created_at
            }));
            
            setArrestReports(transformedReports);
          }
        } catch (error) {
          console.error('Error fetching arrest reports:', error);
          toast.error('فشل في جلب تقارير الاعتقال');
        } finally {
          setIsLoading(false);
        }
        break;
        
      case 'vehicles':
        try {
          // Fetch vehicles
          const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('citizen_id', citizenId);
            
          if (vehiclesError) throw vehiclesError;
          
          setVehicles(vehiclesData || []);
        } catch (error) {
          console.error('Error fetching vehicles:', error);
          toast.error('فشل في جلب المركبات');
        } finally {
          setIsLoading(false);
        }
        break;
        
      case 'warrants':
        try {
          // Fetch warrants
          const { data: warrantsData, error: warrantsError } = await supabase
            .from('warrants')
            .select('*')
            .eq('citizen_id', citizenId);
            
          if (warrantsError) throw warrantsError;

          if (warrantsData) {
            // Fetch officer names
            const officerIds = warrantsData.map((warrant: any) => warrant.issuing_officer_id).filter(Boolean);
            const uniqueOfficerIds = [...new Set(officerIds)];
            
            let officerMap = new Map();
            if (uniqueOfficerIds.length > 0) {
              const { data: officersData } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', uniqueOfficerIds);
              
              if (officersData) {
                officersData.forEach((officer: any) => {
                  officerMap.set(officer.id, officer.name);
                });
              }
            }
            
            // Get citizen name
            const { data: citizenData } = await supabase
              .from('citizens')
              .select('first_name, last_name')
              .eq('id', citizenId)
              .single();
            
            const citizenName = citizenData ? `${citizenData.first_name} ${citizenData.last_name}` : 'مواطن غير معروف';
            
            // Transform data
            const transformedWarrants: Warrant[] = warrantsData.map((warrant: any) => ({
              id: warrant.id,
              citizen_id: warrant.citizen_id,
              citizen_name: citizenName,
              reason: warrant.reason,
              status: warrant.status as 'active' | 'executed' | 'expired',
              issue_date: warrant.issue_date,
              expiry_date: warrant.expiry_date,
              issuing_officer_id: warrant.issuing_officer_id,
              issuing_officer_name: officerMap.get(warrant.issuing_officer_id) || 'ضابط غير معروف',
              created_at: warrant.created_at
            }));
            
            setWarrants(transformedWarrants);
          }
        } catch (error) {
          console.error('Error fetching warrants:', error);
          toast.error('فشل في جلب أوامر التوقيف');
        } finally {
          setIsLoading(false);
        }
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-blue">نشط</Badge>;
      case 'completed':
        return <Badge className="badge-green">مكتمل</Badge>;
      case 'dismissed':
        return <Badge className="badge-yellow">مرفوض</Badge>;
      case 'executed':
        return <Badge className="badge-green">تم تنفيذه</Badge>;
      case 'expired':
        return <Badge className="badge-gray">منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-5">
        <TabsTrigger value="criminal-records">السجل الجنائي</TabsTrigger>
        <TabsTrigger value="citations">المخالفات</TabsTrigger>
        <TabsTrigger value="arrest-reports">تقارير الاعتقال</TabsTrigger>
        <TabsTrigger value="vehicles">المركبات</TabsTrigger>
        <TabsTrigger value="warrants">أوامر التوقيف</TabsTrigger>
      </TabsList>
      
      <TabsContent value="criminal-records" className="mt-4">
        <div className="police-card p-4">
          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : criminalRecords.length > 0 ? (
            <div className="space-y-4">
              {criminalRecords.map((record) => (
                <div key={record.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{record.offense}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{record.description || 'لا يوجد وصف'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex space-x-2 rtl:space-x-reverse mb-1">
                        <span className="text-sm text-muted-foreground">التاريخ:</span>
                        <span className="text-sm">{formatDate(record.date)}</span>
                      </div>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    تم التسجيل بواسطة: {record.officer_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">لا توجد سجلات جنائية لهذا المواطن</div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="citations" className="mt-4">
        <div className="police-card p-4">
          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : citations.length > 0 ? (
            <div className="space-y-4">
              {citations.map((citation) => (
                <div key={citation.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{citation.violation}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        الموقع: {citation.location || 'غير محدد'} • المبلغ: {citation.fine_amount} ريال
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex space-x-2 rtl:space-x-reverse mb-1">
                        <span className="text-sm text-muted-foreground">التاريخ:</span>
                        <span className="text-sm">{formatDate(citation.date)}</span>
                      </div>
                      <Badge className={citation.paid ? "badge-green" : "badge-red"}>
                        {citation.paid ? 'تم الدفع' : 'لم يتم الدفع'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    تم التسجيل بواسطة: {citation.officer_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">لا توجد مخالفات لهذا المواطن</div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="arrest-reports" className="mt-4">
        <div className="police-card p-4">
          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : arrestReports.length > 0 ? (
            <div className="space-y-4">
              {arrestReports.map((report) => (
                <div key={report.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">تقرير اعتقال - {formatDate(report.arrest_date)}</h3>
                      <div className="mt-2">
                        <p className="text-sm font-medium">التهم:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.charges.map((charge, index) => (
                            <Badge key={index} variant="outline">{charge}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium">التفاصيل:</p>
                        <p className="text-sm text-muted-foreground mt-1">{report.narrative}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex space-x-2 rtl:space-x-reverse mb-1">
                        <span className="text-sm text-muted-foreground">الموقع:</span>
                        <span className="text-sm">{report.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    تم التسجيل بواسطة: {report.officer_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">لا توجد تقارير اعتقال لهذا المواطن</div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="vehicles" className="mt-4">
        <div className="police-card p-4">
          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="border border-border/50 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground mt-1" dir="ltr">
                        رقم اللوحة: {vehicle.plate} • اللون: {vehicle.color}
                      </p>
                    </div>
                    <div>
                      {vehicle.stolen ? (
                        <Badge className="badge-red">مسروقة</Badge>
                      ) : !vehicle.registered ? (
                        <Badge className="badge-yellow">غير مسجلة</Badge>
                      ) : (
                        <Badge className="badge-green">مسجلة</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">لا توجد مركبات لهذا المواطن</div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="warrants" className="mt-4">
        <div className="police-card p-4">
          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : warrants.length > 0 ? (
            <div className="space-y-4">
              {warrants.map((warrant) => (
                <div key={warrant.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">أمر توقيف</h3>
                      <p className="text-sm text-muted-foreground mt-1">{warrant.reason}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div>{getStatusBadge(warrant.status)}</div>
                      <div className="text-sm mt-1">
                        <span>تاريخ الإصدار: {formatDate(warrant.issue_date)}</span>
                        <br />
                        <span>تاريخ الانتهاء: {formatDate(warrant.expiry_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    تم الإصدار بواسطة: {warrant.issuing_officer_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">لا توجد أوامر توقيف لهذا المواطن</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default CitizenDetailsTabs;
