
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  UserX,
  Car,
  FileText,
  ClipboardList
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Citizen } from '@/types';

// Mock data
const mockCitizens: Citizen[] = [
  {
    id: '1',
    first_name: 'أحمد',
    last_name: 'السالم',
    date_of_birth: '1985-05-12',
    gender: 'ذكر',
    address: 'حي النزهة، الرياض',
    phone: '0551234567',
    image_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    license_status: 'valid',
    created_at: '2023-01-15T08:30:00.000Z',
  },
  {
    id: '2',
    first_name: 'سارة',
    last_name: 'العتيبي',
    date_of_birth: '1990-08-23',
    gender: 'أنثى',
    address: 'حي الورود، جدة',
    phone: '0559876543',
    image_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    license_status: 'suspended',
    created_at: '2023-02-20T10:15:00.000Z',
  },
  {
    id: '3',
    first_name: 'خالد',
    last_name: 'المحمد',
    date_of_birth: '1975-11-30',
    gender: 'ذكر',
    address: 'حي الروضة، الدمام',
    phone: '0554567890',
    image_url: 'https://randomuser.me/api/portraits/men/67.jpg',
    license_status: 'revoked',
    created_at: '2023-03-10T14:45:00.000Z',
  },
  {
    id: '4',
    first_name: 'منى',
    last_name: 'الحربي',
    date_of_birth: '1988-04-17',
    gender: 'أنثى',
    address: 'حي البساتين، أبها',
    phone: '0556789012',
    license_status: 'none',
    created_at: '2023-04-05T09:20:00.000Z',
  },
  {
    id: '5',
    first_name: 'عبدالله',
    last_name: 'القحطاني',
    date_of_birth: '1980-12-05',
    gender: 'ذكر',
    address: 'حي المروج، الرياض',
    phone: '0552345678',
    image_url: 'https://randomuser.me/api/portraits/men/91.jpg',
    license_status: 'valid',
    created_at: '2023-05-18T11:30:00.000Z',
  },
];

// Mock criminal records
const mockCriminalRecords = [
  {
    id: '101',
    citizen_id: '1',
    offense: 'قيادة بتهور',
    description: 'تم ضبط المتهم يقود بسرعة 160 كم/س في منطقة سكنية',
    date: '2023-06-12T14:30:00.000Z',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    status: 'completed',
  },
  {
    id: '102',
    citizen_id: '1',
    offense: 'مخالفة نظام المرور',
    description: 'قطع الإشارة الحمراء وتجاوز السرعة المسموح بها',
    date: '2023-08-03T09:15:00.000Z',
    officer_id: '2',
    officer_name: 'عبدالله خالد',
    status: 'active',
  },
  {
    id: '103',
    citizen_id: '3',
    offense: 'حيازة ممنوعات',
    description: 'تم ضبط المتهم بحوزته مواد ممنوعة',
    date: '2023-07-22T16:45:00.000Z',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    status: 'active',
  },
];

// Mock vehicles
const mockVehicles = [
  {
    id: '201',
    citizen_id: '1',
    plate: 'ACB 1234',
    model: 'تويوتا كامري 2022',
    color: 'أبيض',
    registered: true,
    stolen: false,
    created_at: '2023-01-20T08:30:00.000Z',
  },
  {
    id: '202',
    citizen_id: '1',
    plate: 'XYZ 5678',
    model: 'نيسان باترول 2020',
    color: 'أسود',
    registered: true,
    stolen: false,
    created_at: '2023-02-15T10:15:00.000Z',
  },
  {
    id: '203',
    citizen_id: '3',
    plate: 'LMN 9012',
    model: 'هوندا أكورد 2021',
    color: 'فضي',
    registered: false,
    stolen: true,
    created_at: '2023-03-05T14:45:00.000Z',
  },
];

// Mock citations
const mockCitations = [
  {
    id: '301',
    citizen_id: '1',
    violation: 'تجاوز السرعة',
    fine_amount: 500,
    date: '2023-06-12T14:30:00.000Z',
    location: 'طريق الملك فهد، الرياض',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    paid: false,
    created_at: '2023-06-12T14:35:00.000Z',
  },
  {
    id: '302',
    citizen_id: '1',
    violation: 'وقوف في مكان ممنوع',
    fine_amount: 200,
    date: '2023-08-03T09:15:00.000Z',
    location: 'شارع التحلية، جدة',
    officer_id: '2',
    officer_name: 'عبدالله خالد',
    paid: true,
    created_at: '2023-08-03T09:20:00.000Z',
  },
];

// Mock arrest reports
const mockArrestReports = [
  {
    id: '401',
    citizen_id: '3',
    officer_id: '1',
    officer_name: 'فهد العنزي',
    charges: ['حيازة ممنوعات', 'مقاومة رجال الأمن'],
    narrative: 'تم ضبط المتهم أثناء دورية روتينية في حي الروضة. عند محاولة إيقافه للتفتيش، حاول الهرب وقاوم رجال الأمن. تم العثور على مواد ممنوعة بحوزته.',
    arrest_date: '2023-07-22T16:45:00.000Z',
    location: 'حي الروضة، الدمام',
    created_at: '2023-07-22T18:30:00.000Z',
  },
];

const CitizensPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredCitizens = searchQuery
    ? mockCitizens.filter((citizen) => 
        `${citizen.first_name} ${citizen.last_name}`.includes(searchQuery) ||
        citizen.phone.includes(searchQuery))
    : mockCitizens;

  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setIsDialogOpen(true);
  };

  const getCitizenCriminalRecords = (citizenId: string) => {
    return mockCriminalRecords.filter((record) => record.citizen_id === citizenId);
  };

  const getCitizenVehicles = (citizenId: string) => {
    return mockVehicles.filter((vehicle) => vehicle.citizen_id === citizenId);
  };

  const getCitizenCitations = (citizenId: string) => {
    return mockCitations.filter((citation) => citation.citizen_id === citizenId);
  };

  const getCitizenArrestReports = (citizenId: string) => {
    return mockArrestReports.filter((report) => report.citizen_id === citizenId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="badge-green">صالحة</Badge>;
      case 'suspended':
        return <Badge className="badge-yellow">موقوفة</Badge>;
      case 'revoked':
        return <Badge className="badge-red">ملغاة</Badge>;
      case 'none':
        return <Badge variant="outline">لا يوجد</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">المواطنون</h2>
        <Button className="police-button">
          <Plus className="ml-2 h-4 w-4" /> إضافة مواطن
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="بحث عن مواطن..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="police-input pr-10"
        />
      </div>
      
      <div className="border border-border/50 rounded-md overflow-hidden">
        <table className="police-table">
          <thead>
            <tr>
              <th className="w-1/6">الاسم الكامل</th>
              <th className="w-1/6">تاريخ الميلاد</th>
              <th className="w-1/6">رقم الهاتف</th>
              <th className="w-1/6">رخصة القيادة</th>
              <th className="w-1/4">العنوان</th>
              <th className="w-1/12"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCitizens.map((citizen) => (
              <tr
                key={citizen.id}
                className="cursor-pointer"
                onClick={() => handleSelectCitizen(citizen)}
              >
                <td className="font-medium">{citizen.first_name} {citizen.last_name}</td>
                <td>{formatDate(citizen.date_of_birth)}</td>
                <td dir="ltr">{citizen.phone}</td>
                <td>{getLicenseStatusBadge(citizen.license_status)}</td>
                <td>{citizen.address}</td>
                <td>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Search className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filteredCitizens.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  لا توجد نتائج مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedCitizen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl">معلومات المواطن</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="police-card overflow-hidden flex flex-col items-center p-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-secondary/80">
                    {selectedCitizen.image_url ? (
                      <img 
                        src={selectedCitizen.image_url} 
                        alt={`${selectedCitizen.first_name} ${selectedCitizen.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-foreground">
                        <span className="text-3xl">{selectedCitizen.first_name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-center mb-1">
                    {selectedCitizen.first_name} {selectedCitizen.last_name}
                  </h2>
                  
                  <div className="text-sm text-muted-foreground text-center">
                    الهوية الوطنية: {1000000000 + parseInt(selectedCitizen.id)}
                  </div>
                  
                  <div className="mt-4 w-full">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">الجنس:</div>
                      <div>{selectedCitizen.gender}</div>
                      
                      <div className="font-medium">تاريخ الميلاد:</div>
                      <div>{formatDate(selectedCitizen.date_of_birth)}</div>
                      
                      <div className="font-medium">رقم الهاتف:</div>
                      <div dir="ltr">{selectedCitizen.phone}</div>
                      
                      <div className="font-medium">رخصة القيادة:</div>
                      <div>{getLicenseStatusBadge(selectedCitizen.license_status)}</div>
                    </div>
                    
                    <div className="mt-4 text-sm">
                      <div className="font-medium mb-1">العنوان:</div>
                      <div className="bg-secondary/50 p-2 rounded-md text-foreground">
                        {selectedCitizen.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <Tabs defaultValue="criminal">
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
                      
                      {getCitizenCriminalRecords(selectedCitizen.id).length > 0 ? (
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
                              {getCitizenCriminalRecords(selectedCitizen.id).map((record) => (
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
                      
                      {getCitizenVehicles(selectedCitizen.id).length > 0 ? (
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
                              {getCitizenVehicles(selectedCitizen.id).map((vehicle) => (
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
                      
                      {getCitizenCitations(selectedCitizen.id).length > 0 ? (
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
                              {getCitizenCitations(selectedCitizen.id).map((citation) => (
                                <tr key={citation.id}>
                                  <td className="font-medium">{citation.violation}</td>
                                  <td>{citation.fine_amount} ريال</td>
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
                      
                      {getCitizenArrestReports(selectedCitizen.id).length > 0 ? (
                        <div className="space-y-4">
                          {getCitizenArrestReports(selectedCitizen.id).map((report) => (
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
                                    {report.charges.map((charge, index) => (
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
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CitizensPage;
