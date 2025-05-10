import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Warrant, Citizen } from '@/types';

// Import refactored components
import WarrantsList from '@/components/warrants/WarrantsList';
import AddWarrantDialog from '@/components/warrants/AddWarrantDialog';
import EditWarrantDialog from '@/components/warrants/EditWarrantDialog';
import DeleteWarrantDialog from '@/components/warrants/DeleteWarrantDialog';

const WarrantsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [selectedWarrant, setSelectedWarrant] = useState<Warrant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  
  // Edit warrant form state
  const [editWarrant, setEditWarrant] = useState({
    id: '',
    citizen_id: '',
    reason: '',
    issue_date: '',
    expiry_date: '',
    status: 'active' as 'active' | 'executed' | 'expired'
  });

  // Fetch warrants from Supabase
  useEffect(() => {
    const fetchWarrants = async () => {
      setIsLoading(true);
      try {
        // Fetch warrants
        const { data: warrantsData, error: warrantsError } = await supabase
          .from('warrants')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (warrantsError) throw warrantsError;
        
        if (!warrantsData || warrantsData.length === 0) {
          setWarrants([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch citizen data
        const citizenIds = warrantsData.map((warrant: any) => warrant.citizen_id);
        const uniqueCitizenIds = [...new Set(citizenIds)];
        
        const { data: citizensData, error: citizensError } = await supabase
          .from('citizens')
          .select('id, first_name, last_name')
          .in('id', uniqueCitizenIds);
          
        if (citizensError) throw citizensError;
        
        // Create a map of citizen IDs to names
        const citizenMap = new Map();
        citizensData?.forEach((citizen: any) => {
          citizenMap.set(citizen.id, `${citizen.first_name} ${citizen.last_name}`);
        });
        
        // Separately fetch officer data
        const officerIds = warrantsData.map((warrant: any) => warrant.issuing_officer_id).filter(Boolean);
        const uniqueOfficerIds = [...new Set(officerIds)];
        
        let officerMap = new Map();
        if (uniqueOfficerIds.length > 0) {
          const { data: officersData, error: officersError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueOfficerIds);
            
          if (officersError) {
            console.error('Error fetching officer data:', officersError);
            // Continue even if there's an error fetching officer data
          } else if (officersData) {
            // Create a map of officer IDs to names
            officersData.forEach((officer: any) => {
              officerMap.set(officer.id, officer.name);
            });
          }
        }
        
        // Transform data to match Warrant type
        const transformedWarrants: Warrant[] = warrantsData.map((w: any) => ({
          id: w.id,
          citizen_id: w.citizen_id,
          citizen_name: citizenMap.get(w.citizen_id) || 'مواطن غير معروف',
          reason: w.reason,
          status: w.status as 'active' | 'executed' | 'expired',
          issue_date: w.issue_date,
          expiry_date: w.expiry_date,
          issuing_officer_id: w.issuing_officer_id,
          issuing_officer_name: officerMap.get(w.issuing_officer_id) || 'ضابط غير معروف',
          created_at: w.created_at
        }));
        
        setWarrants(transformedWarrants);
      } catch (error) {
        console.error('Error fetching warrants:', error);
        toast.error('فشل في جلب بيانات أوامر التوقيف');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWarrants();
  }, []);

  // Filter warrants based on search query
  const filteredWarrants = searchQuery
    ? warrants.filter(warrant => 
        warrant.citizen_name.includes(searchQuery) ||
        warrant.reason.includes(searchQuery))
    : warrants;
    
  const handleEditClick = (warrant: Warrant) => {
    setSelectedWarrant(warrant);
    setEditWarrant({
      id: warrant.id,
      citizen_id: warrant.citizen_id,
      reason: warrant.reason,
      issue_date: warrant.issue_date,
      expiry_date: warrant.expiry_date,
      status: warrant.status as 'active' | 'executed' | 'expired'
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (warrant: Warrant) => {
    setSelectedWarrant(warrant);
    setIsDeleteDialogOpen(true);
  };

  const handleWarrantAdded = (newWarrant: Warrant) => {
    setWarrants([newWarrant, ...warrants]);
  };
  
  const handleEditWarrant = async () => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('warrants')
        .update({
          reason: editWarrant.reason,
          issue_date: editWarrant.issue_date,
          expiry_date: editWarrant.expiry_date,
          status: editWarrant.status
        })
        .eq('id', editWarrant.id);
      
      if (error) throw error;
      
      // Update in local state
      setWarrants(warrants.map(w => {
        if (w.id === editWarrant.id) {
          return {
            ...w,
            reason: editWarrant.reason,
            issue_date: editWarrant.issue_date,
            expiry_date: editWarrant.expiry_date,
            status: editWarrant.status
          };
        }
        return w;
      }));
      
      setIsEditDialogOpen(false);
      toast.success("تم تحديث أمر التوقيف بنجاح");
      
      // Add notification about the update
      if (selectedWarrant) {
        await supabase.from('notifications').insert({
          title: 'تحديث أمر توقيف',
          description: `تم تحديث أمر التوقيف بحق المواطن ${selectedWarrant.citizen_name}`,
          read: false,
          type: 'info',
          created_by: user?.id,
          related_to: selectedWarrant.id
        });
      }
    } catch (error) {
      console.error('Error updating warrant:', error);
      toast.error("فشل في تحديث أمر التوقيف");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteWarrant = async () => {
    if (!selectedWarrant) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('warrants')
        .delete()
        .eq('id', selectedWarrant.id);
      
      if (error) throw error;
      
      // Remove from local state
      setWarrants(warrants.filter(w => w.id !== selectedWarrant.id));
      
      // Add notification about the deletion
      await supabase.from('notifications').insert({
        title: 'حذف أمر توقيف',
        description: `تم حذف أمر التوقيف بحق المواطن ${selectedWarrant.citizen_name}`,
        read: false,
        type: 'error',
        created_by: user?.id
      });
      
      setIsDeleteDialogOpen(false);
      toast.success("تم حذف أمر التوقيف بنجاح");
    } catch (error) {
      console.error('Error deleting warrant:', error);
      toast.error("فشل في حذف أمر التوقيف");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="ml-2 h-5 w-5 text-police-blue" />
          <h2 className="text-2xl font-bold">أوامر التوقيف</h2>
        </div>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" /> إضافة أمر توقيف
        </Button>
      </div>
      
      <div className="flex space-x-4 rtl:space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن أمر توقيف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="police-input pr-10"
          />
        </div>
      </div>
      
      <WarrantsList
        warrants={warrants}
        isLoading={isLoading}
        filteredWarrants={filteredWarrants}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        formatDate={formatDate}
      />
      
      <AddWarrantDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onWarrantAdded={handleWarrantAdded}
      />
      
      <EditWarrantDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editWarrant={editWarrant}
        setEditWarrant={setEditWarrant}
        handleEditWarrant={handleEditWarrant}
        isSubmitting={isSubmitting}
      />
      
      <DeleteWarrantDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={handleDeleteWarrant}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default WarrantsPage;
