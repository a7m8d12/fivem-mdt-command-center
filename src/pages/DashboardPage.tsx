
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  FileText, 
  Clipboard, 
  User, 
  AlertTriangle, 
  Car, 
  ClipboardList, 
  Bell, 
  Plus 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    citizensCount: 0,
    vehiclesCount: 0,
    citationsCount: 0,
    warrantsCount: 0,
    criminalRecordsCount: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch citizen count
        const { count: citizensCount, error: citizensError } = await supabase
          .from('citizens')
          .select('*', { count: 'exact', head: true });

        // Fetch vehicles count
        const { count: vehiclesCount, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true });

        // Fetch citations count
        const { count: citationsCount, error: citationsError } = await supabase
          .from('citations')
          .select('*', { count: 'exact', head: true });

        // Fetch warrants count
        const { count: warrantsCount, error: warrantsError } = await supabase
          .from('warrants')
          .select('*', { count: 'exact', head: true });

        // Fetch criminal records count
        const { count: criminalRecordsCount, error: criminalRecordsError } = await supabase
          .from('criminal_records')
          .select('*', { count: 'exact', head: true });

        if (citizensError || vehiclesError || citationsError || warrantsError || criminalRecordsError) {
          throw new Error('فشل في جلب بيانات الإحصائيات');
        }

        setStats({
          citizensCount: citizensCount || 0,
          vehiclesCount: vehiclesCount || 0,
          citationsCount: citationsCount || 0,
          warrantsCount: warrantsCount || 0,
          criminalRecordsCount: criminalRecordsCount || 0
        });

        // Fetch recent activities (combining various activities)
        const fetchRecentActivities = async () => {
          // Fetch recent citations
          const { data: recentCitations, error: citationsError } = await supabase
            .from('citations')
            .select(`
              id, 
              violation, 
              date, 
              created_at,
              profiles:officer_id (name),
              citizens:citizen_id (first_name, last_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          // Fetch recent warrants
          const { data: recentWarrants, error: warrantsError } = await supabase
            .from('warrants')
            .select(`
              id, 
              reason, 
              issue_date, 
              created_at,
              profiles:issuing_officer_id (name),
              citizens:citizen_id (first_name, last_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          // Fetch recent citizens
          const { data: recentCitizens, error: citizensError } = await supabase
            .from('citizens')
            .select(`
              id, 
              first_name, 
              last_name, 
              created_at,
              profiles:created_by (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          if (citationsError || warrantsError || citizensError) {
            throw new Error('فشل في جلب بيانات الأنشطة الحديثة');
          }

          // Transform citations to activities
          const citationActivities = recentCitations ? recentCitations.map(citation => ({
            id: `citation-${citation.id}`,
            type: 'citation',
            title: `مخالفة: ${citation.violation}`,
            citizenName: citation.citizens ? `${citation.citizens.first_name} ${citation.citizens.last_name}` : 'مواطن غير معروف',
            officerName: citation.profiles?.name || 'ضابط غير معروف',
            date: citation.date,
            created_at: citation.created_at
          })) : [];

          // Transform warrants to activities
          const warrantActivities = recentWarrants ? recentWarrants.map(warrant => ({
            id: `warrant-${warrant.id}`,
            type: 'warrant',
            title: `أمر توقيف: ${warrant.reason.substring(0, 30)}${warrant.reason.length > 30 ? '...' : ''}`,
            citizenName: warrant.citizens ? `${warrant.citizens.first_name} ${warrant.citizens.last_name}` : 'مواطن غير معروف',
            officerName: warrant.profiles?.name || 'ضابط غير معروف',
            date: warrant.issue_date,
            created_at: warrant.created_at
          })) : [];

          // Transform citizens to activities
          const citizenActivities = recentCitizens ? recentCitizens.map(citizen => ({
            id: `citizen-${citizen.id}`,
            type: 'citizen',
            title: `إضافة مواطن جديد`,
            citizenName: `${citizen.first_name} ${citizen.last_name}`,
            officerName: citizen.profiles?.name || 'ضابط غير معروف',
            date: citizen.created_at,
            created_at: citizen.created_at
          })) : [];

          // Combine all activities and sort by created_at
          const allActivities = [
            ...citationActivities,
            ...warrantActivities,
            ...citizenActivities
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10);

          return allActivities;
        };

        const activities = await fetchRecentActivities();
        setRecentActivities(activities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'search':
        navigate('/search');
        break;
      case 'report':
        navigate('/reports/create');
        break;
      case 'citizen':
        navigate('/citizens');
        break;
      case 'citation':
        navigate('/citations');
        break;
      default:
        break;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'citation':
        return <ClipboardList className="h-5 w-5 text-police-blue" />;
      case 'warrant':
        return <AlertTriangle className="h-5 w-5 text-police-red" />;
      case 'citizen':
        return <User className="h-5 w-5 text-police-green" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold">مرحبا، {user?.name || 'ضابط'}</h2>
          <p className="text-muted-foreground">مرحبا بك في نظام إدارة البيانات المتنقلة للشرطة</p>
        </div>
        
        <div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="البحث عن مواطن، مركبة، أو مخالفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="police-input pr-10"
            />
          </form>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="police-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>المواطنون</span>
              <User className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.citizensCount}
            </div>
          </CardContent>
        </Card>
        
        <Card className="police-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>المركبات</span>
              <Car className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.vehiclesCount}
            </div>
          </CardContent>
        </Card>
        
        <Card className="police-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>المخالفات</span>
              <ClipboardList className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.citationsCount}
            </div>
          </CardContent>
        </Card>
        
        <Card className="police-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>أوامر التوقيف</span>
              <AlertTriangle className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.warrantsCount}
            </div>
          </CardContent>
        </Card>
        
        <Card className="police-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>السجلات الجنائية</span>
              <Clipboard className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.criminalRecordsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Button onClick={() => handleQuickAction('search')} className="police-card p-6 h-auto flex flex-col items-center justify-center gap-2 hover:bg-secondary/50">
          <Search className="h-10 w-10" />
          <span className="text-lg font-medium">بحث</span>
        </Button>
        
        <Button onClick={() => handleQuickAction('report')} className="police-card p-6 h-auto flex flex-col items-center justify-center gap-2 hover:bg-secondary/50">
          <FileText className="h-10 w-10" />
          <span className="text-lg font-medium">إنشاء تقرير</span>
        </Button>
        
        <Button onClick={() => handleQuickAction('citizen')} className="police-card p-6 h-auto flex flex-col items-center justify-center gap-2 hover:bg-secondary/50">
          <User className="h-10 w-10" />
          <span className="text-lg font-medium">إضافة مواطن</span>
        </Button>
        
        <Button onClick={() => handleQuickAction('citation')} className="police-card p-6 h-auto flex flex-col items-center justify-center gap-2 hover:bg-secondary/50">
          <ClipboardList className="h-10 w-10" />
          <span className="text-lg font-medium">إصدار مخالفة</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="police-card">
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <CardTitle>الأنشطة الأخيرة</CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">جاري تحميل الأنشطة...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                        <span>المواطن: {activity.citizenName}</span>
                        <span>•</span>
                        <span>الضابط: {activity.officerName}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                لا توجد أنشطة حديثة
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="police-card">
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <CardTitle>أوامر التوقيف النشطة</CardTitle>
            <AlertTriangle className="h-5 w-5 text-police-red" />
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">جاري تحميل البيانات...</p>
              </div>
            ) : (
              <ActiveWarrantsList />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ActiveWarrantsList = () => {
  const [activeWarrants, setActiveWarrants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveWarrants = async () => {
      try {
        const { data, error } = await supabase
          .from('warrants')
          .select(`
            id,
            reason,
            issue_date,
            expiry_date,
            citizens (first_name, last_name)
          `)
          .eq('status', 'active')
          .order('issue_date', { ascending: false })
          .limit(5);

        if (error) throw error;

        setActiveWarrants(data || []);
      } catch (error) {
        console.error('Error fetching active warrants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveWarrants();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return isLoading ? (
    <div className="text-center text-muted-foreground py-6">
      جاري تحميل البيانات...
    </div>
  ) : activeWarrants.length > 0 ? (
    <div className="space-y-4">
      {activeWarrants.map((warrant) => (
        <div key={warrant.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
          <div className="shrink-0">
            <AlertTriangle className="h-5 w-5 text-police-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {warrant.citizens ? 
                `${warrant.citizens.first_name} ${warrant.citizens.last_name}` : 
                'مواطن غير معروف'}
            </h4>
            <p className="text-xs truncate">{warrant.reason}</p>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground space-y-1 text-left">
            <div>صدر: {formatDate(warrant.issue_date)}</div>
            <div>ينتهي: {formatDate(warrant.expiry_date)}</div>
          </div>
        </div>
      ))}
      
      <div className="pt-2">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/warrants')}
        >
          عرض جميع أوامر التوقيف
          <Plus className="mr-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  ) : (
    <div className="text-center text-muted-foreground py-6">
      لا توجد أوامر توقيف نشطة حاليًا
    </div>
  );
};

export default DashboardPage;
