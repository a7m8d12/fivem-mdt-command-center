
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Warrant } from '@/types';

interface WarrantsListProps {
  warrants: Warrant[];
  isLoading: boolean;
  filteredWarrants: Warrant[];
  onEditClick: (warrant: Warrant) => void;
  onDeleteClick: (warrant: Warrant) => void;
  formatDate: (date: string) => string;
}

const WarrantsList = ({ 
  warrants, 
  isLoading, 
  filteredWarrants,
  onEditClick,
  onDeleteClick,
  formatDate
}: WarrantsListProps) => {

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
    <div className="border border-border/50 rounded-md overflow-hidden">
      <table className="police-table">
        <thead>
          <tr>
            <th>المواطن</th>
            <th>سبب أمر التوقيف</th>
            <th>تاريخ الإصدار</th>
            <th>تاريخ الانتهاء</th>
            <th>الضابط المسؤول</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-4 text-muted-foreground">
                جاري تحميل البيانات...
              </td>
            </tr>
          ) : filteredWarrants.length > 0 ? (
            filteredWarrants.map((warrant) => (
              <tr key={warrant.id}>
                <td className="font-medium">{warrant.citizen_name}</td>
                <td>{warrant.reason}</td>
                <td>{formatDate(warrant.issue_date)}</td>
                <td>{formatDate(warrant.expiry_date)}</td>
                <td>{warrant.issuing_officer_name}</td>
                <td>{getStatusBadge(warrant.status)}</td>
                <td>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button variant="ghost" size="sm" onClick={() => onEditClick(warrant)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteClick(warrant)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-4 text-muted-foreground">
                لا توجد أوامر توقيف مطابقة للبحث
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WarrantsList;
