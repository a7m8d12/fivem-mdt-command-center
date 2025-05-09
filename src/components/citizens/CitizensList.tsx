
import React, { useState } from 'react';
import { Citizen } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface CitizensListProps {
  citizens: Citizen[];
  isLoading: boolean;
  searchQuery: string;
  onSelectCitizen: (citizen: Citizen) => void;
}

const CitizensList = ({ citizens, isLoading, searchQuery, onSelectCitizen }: CitizensListProps) => {
  // Filter citizens based on search query
  const filteredCitizens = searchQuery
    ? citizens.filter((citizen) => 
        `${citizen.first_name} ${citizen.last_name}`.includes(searchQuery) ||
        (citizen.phone && citizen.phone.includes(searchQuery)))
    : citizens;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getLicenseStatusBadge = (status: 'valid' | 'suspended' | 'revoked' | 'none') => {
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
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted-foreground">
                جاري تحميل البيانات...
              </td>
            </tr>
          ) : filteredCitizens.length > 0 ? (
            filteredCitizens.map((citizen) => (
              <tr
                key={citizen.id}
                className="cursor-pointer"
                onClick={() => onSelectCitizen(citizen)}
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
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted-foreground">
                لا توجد نتائج مطابقة للبحث
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CitizensList;
