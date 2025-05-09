
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Car, 
  FileText, 
  AlertTriangle,
  Calendar,
  Search,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Dashboard counter card component
const CounterCard = ({ title, count, icon: Icon, color }: { title: string; count: number; icon: React.ElementType; color: string }) => (
  <Card>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-3xl font-bold mt-2">{count}</h3>
      </div>
      <div className={`w-12 h-12 rounded-full bg-${color}/20 flex items-center justify-center`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
    </CardContent>
  </Card>
);

// Recharts colors
const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    citizenCount: 0,
    vehicleCount: 0,
    activeWarrantsCount: 0,
    criminalRecordsCount: 0,
    recentCitations: [],
    recentWarrants: [],
    recentActivities: [],
    vehicleStatusData: [],
    warrantStatusData: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch counts
        const [
          { count: citizenCount },
          { count: vehicleCount },
          { count: activeWarrantsCount },
          { count: criminalRecordsCount }
        ] = await Promise.all([
          supabase.from('citizens').select('*', { count: 'exact', head: true }),
          supabase.from('vehicles').select('*', { count: 'exact', head: true }),
          supabase.from('warrants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('criminal_records').select('*', { count: 'exact', head: true })
        ]);

        // Fetch recent citations
        const { data: recentCitationsData } = await supabase
          .from('citations')
          .select(`
            *,
            citizens (first_name, last_name),
            profiles:officer_id (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Format citations data
        const recentCitations = recentCitationsData?.map(citation => ({
          id: citation.id,
          citizen_name: citation.citizens ? `${citation.citizens.first_name} ${citation.citizens.last_name}` : 'مواطن غير معروف',
          violation: citation.violation,
          date: new Date(citation.date).toLocaleDateString('ar-SA'),
          fine_amount: citation.fine_amount,
          officer_name: citation.profiles?.name || 'ضابط غير معروف',
          paid: citation.paid
        })) || [];

        // Fetch recent warrants
        const { data: recentWarrantsData } = await supabase
          .from('warrants')
          .select(`
            *,
            citizens (first_name, last_name),
            profiles:issuing_officer_id (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Format warrants data
        const recentWarrants = recentWarrantsData?.map(warrant => ({
          id: warrant.id,
          citizen_name: warrant.citizens ? `${warrant.citizens.first_name} ${warrant.citizens.last_name}` : 'مواطن غير معروف',
          reason: warrant.reason,
          issue_date: new Date(warrant.issue_date).toLocaleDateString('ar-SA'),
          status: warrant.status,
          officer_name: warrant.profiles?.name || 'ضابط غير معروف'
        })) || [];

        // Fetch recent activities (mix of different events)
        const { data: recentActivitiesData } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // Format activities data
        const recentActivities = recentActivitiesData?.map(activity => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          date: new Date(activity.created_at).toLocaleDateString('ar-SA'),
          time: new Date(activity.created_at).toLocaleTimeString('ar-SA'),
          type: activity.type || 'info'
        })) || [];

        // Get vehicle status data for chart
        const { data: vehiclesStatusData } = await supabase
          .from('vehicles')
          .select('registered, stolen');

        const vehicleStatusCounts = {
          registered: 0,
          unregistered: 0,
          stolen: 0
        };

        vehiclesStatusData?.forEach(vehicle => {
          if (vehicle.stolen) {
            vehicleStatusCounts.stolen++;
          } else if (vehicle.registered) {
            vehicleStatusCounts.registered++;
          } else {
            vehicleStatusCounts.unregistered++;
          }
        });

        const vehicleStatusData = [
          { name: 'مسجلة', value: vehicleStatusCounts.registered },
          { name: 'غير مسجلة', value: vehicleStatusCounts.unregistered },
          { name: 'مسروقة', value: vehicleStatusCounts.stolen }
        ];

        // Get warrant status data for chart
        const { data: warrantStatusData } = await supabase
          .from('warrants')
          .select('status');

        const warrantStatusCounts = {
          active: 0,
          executed: 0,
          expired: 0
        };

        warrantStatusData?.forEach(warrant => {
          if (warrant.status === 'active') {
            warrantStatusCounts.active++;
          } else if (warrant.status === 'executed') {
            warrantStatusCounts.executed++;
          } else if (warrant.status === 'expired') {
            warrantStatusCounts.expired++;
          }
        });

        const formattedWarrantStatusData = [
          { name: 'نشطة', value: warrantStatusCounts.active },
          { name: 'تم تنفيذها', value: warrantStatusCounts.executed },
          { name: 'منتهية', value: warrantStatusCounts.expired }
        ];

        // Update state with all data
        setDashboardData({
          citizenCount: citizenCount || 0,
          vehicleCount: vehicleCount || 0,
          activeWarrantsCount: activeWarrantsCount || 0,
          criminalRecordsCount: criminalRecordsCount || 0,
          recentCitations,
          recentWarrants,
          recentActivities,
          vehicleStatusData,
          warrantStatusData: formattedWarrantStatusData,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('فشل في جلب بيانات لوحة المعلومات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-police-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">لوحة المعلومات</h1>
        <div className="text-muted-foreground">
          مرحباً بك، {user?.name}
        </div>
      </div>

      {/* Stats/Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CounterCard title="المواطنون" count={dashboardData.citizenCount} icon={User} color="blue" />
        <CounterCard title="المركبات" count={dashboardData.vehicleCount} icon={Car} color="green" />
        <CounterCard title="أوامر التوقيف النشطة" count={dashboardData.activeWarrantsCount} icon={AlertTriangle} color="orange" />
        <CounterCard title="السجلات الجنائية" count={dashboardData.criminalRecordsCount} icon={FileText} color="red" />
      </div>

      {/* Quick Actions */}
      <Card className="p-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/search')}>
            <Search className="h-4 w-4 mr-2" /> بحث
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/citizens')}>
            <User className="h-4 w-4 mr-2" /> عرض المواطنين
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/vehicles')}>
            <Car className="h-4 w-4 mr-2" /> عرض المركبات
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/warrants')}>
            <AlertTriangle className="h-4 w-4 mr-2" /> أوامر التوقيف
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/reports/new')}>
            <Plus className="h-4 w-4 mr-2" /> إنشاء تقرير
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Citations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر المخالفات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium">المواطن</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">المخالفة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">الغرامة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboardData.recentCitations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">لا توجد مخالفات حديثة</td>
                    </tr>
                  ) : dashboardData.recentCitations.map((citation: any) => (
                    <tr key={citation.id}>
                      <td className="px-4 py-3 text-sm">{citation.citizen_name}</td>
                      <td className="px-4 py-3 text-sm">{citation.violation}</td>
                      <td className="px-4 py-3 text-sm">{citation.fine_amount} دينار عراقي</td>
                      <td className="px-4 py-3 text-sm">
                        {citation.paid ? 
                          <Badge className="badge-green">مدفوعة</Badge> : 
                          <Badge className="badge-red">غير مدفوعة</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Warrants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر أوامر التوقيف</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium">المواطن</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">السبب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">تاريخ الإصدار</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboardData.recentWarrants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">لا توجد أوامر توقيف حديثة</td>
                    </tr>
                  ) : dashboardData.recentWarrants.map((warrant: any) => (
                    <tr key={warrant.id}>
                      <td className="px-4 py-3 text-sm">{warrant.citizen_name}</td>
                      <td className="px-4 py-3 text-sm">{warrant.reason.slice(0, 30)}...</td>
                      <td className="px-4 py-3 text-sm">{warrant.issue_date}</td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(warrant.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">النشاطات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد نشاطات حديثة
              </div>
            ) : (
              dashboardData.recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex space-x-4 rtl:space-x-reverse items-start border-b pb-4 last:border-b-0 last:pb-0">
                  <div className={`p-2 rounded-full bg-${activity.type === 'warning' ? 'orange' : activity.type === 'error' ? 'red' : activity.type === 'success' ? 'green' : 'blue'}-100`}>
                    <Calendar className={`h-4 w-4 text-${activity.type === 'warning' ? 'orange' : activity.type === 'error' ? 'red' : activity.type === 'success' ? 'green' : 'blue'}-500`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{activity.date} - {activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">إحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2">
                <h4 className="text-sm font-medium mb-2 text-center">حالة المركبات</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.vehicleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2">
                <h4 className="text-sm font-medium mb-2 text-center">حالة أوامر التوقيف</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.warrantStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.warrantStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
