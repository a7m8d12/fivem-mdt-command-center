
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  Car, 
  AlertTriangle, 
  Search,
  ClipboardList,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    {
      name: 'المواطنون',
      value: '1,284',
      icon: Users,
      color: 'text-blue-500',
      href: '/citizens',
    },
    {
      name: 'السجلات الجنائية',
      value: '482',
      icon: User,
      color: 'text-red-500',
      href: '/criminal-records',
    },
    {
      name: 'المركبات',
      value: '2,157',
      icon: Car,
      color: 'text-green-500',
      href: '/vehicles',
    },
    {
      name: 'أوامر التوقيف',
      value: '24',
      icon: AlertTriangle,
      color: 'text-yellow-500',
      href: '/warrants',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      officer: 'محمد العلي',
      action: 'أصدر مخالفة مرورية',
      subject: 'أحمد السالم',
      time: 'قبل 8 دقائق',
    },
    {
      id: 2,
      officer: 'عبدالله خالد',
      action: 'سجل تقرير اعتقال',
      subject: 'سعد الفهد',
      time: 'قبل 15 دقيقة',
    },
    {
      id: 3,
      officer: 'فهد العنزي',
      action: 'بحث عن مركبة',
      subject: 'لوحة رقم: HGJ 5423',
      time: 'قبل 27 دقيقة',
    },
    {
      id: 4,
      officer: 'خالد العبيد',
      action: 'أصدر أمر توقيف',
      subject: 'علي محمد',
      time: 'قبل 45 دقيقة',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">لوحة المعلومات</h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <p className="text-sm text-muted-foreground">مرحباً، {user?.name}</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="police-card" onClick={() => navigate(stat.href)} 
                style={{cursor: 'pointer'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="police-card">
          <CardHeader>
            <CardTitle className="text-lg">الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex items-center justify-center gap-2" onClick={() => navigate('/search')}>
                <Search className="h-4 w-4" /> بحث
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2" onClick={() => navigate('/reports/create')}>
                <FileText className="h-4 w-4" /> إنشاء تقرير
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2" onClick={() => navigate('/citizens/create')}>
                <Users className="h-4 w-4" /> إضافة مواطن
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2" onClick={() => navigate('/citations/create')}>
                <ClipboardList className="h-4 w-4" /> إصدار مخالفة
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="police-card">
          <CardHeader>
            <CardTitle className="text-lg">النشاطات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="bg-secondary/50 h-9 w-9 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-police-blue" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.officer} <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.subject} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
