
import React from 'react';
import { Citizen } from '@/types';
import { Badge } from '@/components/ui/badge';
import CitizenDetailsTabs from './CitizenDetailsTabs';

interface CitizenDetailsProps {
  citizen: Citizen;
  formatDate: (date: string) => string;
}

const CitizenDetails = ({ citizen, formatDate }: CitizenDetailsProps) => {
  
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
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <div className="police-card overflow-hidden flex flex-col items-center p-4">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-secondary/80">
            {citizen.image_url ? (
              <img 
                src={citizen.image_url} 
                alt={`${citizen.first_name} ${citizen.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary text-foreground">
                <span className="text-3xl">{citizen.first_name.charAt(0)}</span>
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-center mb-1">
            {citizen.first_name} {citizen.last_name}
          </h2>
          
          <div className="text-sm text-muted-foreground text-center">
            الهوية الوطنية: {citizen.id.substring(0, 8)}
          </div>
          
          <div className="mt-4 w-full">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">الجنس:</div>
              <div>{citizen.gender}</div>
              
              <div className="font-medium">تاريخ الميلاد:</div>
              <div>{formatDate(citizen.date_of_birth)}</div>
              
              <div className="font-medium">رقم الهاتف:</div>
              <div dir="ltr">{citizen.phone}</div>
              
              <div className="font-medium">رخصة القيادة:</div>
              <div>{getLicenseStatusBadge(citizen.license_status)}</div>
            </div>
            
            <div className="mt-4 text-sm">
              <div className="font-medium mb-1">العنوان:</div>
              <div className="bg-secondary/50 p-2 rounded-md text-foreground">
                {citizen.address || "غير متوفر"}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-span-2">
        <CitizenDetailsTabs 
          citizenId={citizen.id} 
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default CitizenDetails;
