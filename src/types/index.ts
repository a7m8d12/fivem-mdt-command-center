
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'officer' | 'dispatch';
  badge_number: string;
  created_at: string;
}

export interface Citizen {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  address: string;
  phone: string;
  image_url?: string;
  license_status: 'valid' | 'suspended' | 'revoked' | 'none';
  created_at: string;
}

export interface Vehicle {
  id: string;
  citizen_id: string;
  plate: string;
  model: string;
  color: string;
  registered: boolean;
  stolen: boolean;
  created_at: string;
}

export interface CriminalRecord {
  id: string;
  citizen_id: string;
  offense: string;
  description: string;
  date: string;
  officer_id: string;
  officer_name: string;
  status: 'active' | 'completed' | 'dismissed';
  created_at: string;
}

export interface Citation {
  id: string;
  citizen_id: string;
  violation: string;
  fine_amount: number;
  date: string;
  location: string;
  officer_id: string;
  officer_name: string;
  paid: boolean;
  created_at: string;
}

export interface ArrestReport {
  id: string;
  citizen_id: string;
  officer_id: string;
  officer_name: string;
  charges: string[];
  narrative: string;
  arrest_date: string;
  location: string;
  created_at: string;
}

export interface Warrant {
  id: string;
  citizen_id: string;
  citizen_name: string;
  reason: string;
  status: 'active' | 'executed' | 'expired';
  issue_date: string;
  expiry_date: string;
  issuing_officer_id: string;
  issuing_officer_name: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success' | 'error';
  related_to?: string;
  created_at: string;
}
