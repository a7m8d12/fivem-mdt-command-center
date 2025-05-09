
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Citizen } from '@/types';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

// Import our new components
import CitizensList from '@/components/citizens/CitizensList';
import AddCitizenDialog from '@/components/citizens/AddCitizenDialog';
import CitizenDetails from '@/components/citizens/CitizenDetails';

const CitizensPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch citizens from Supabase
  useEffect(() => {
    const fetchCitizens = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('citizens')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Transform data to match Citizen type
        const transformedData: Citizen[] = data.map((citizen: any) => ({
          id: citizen.id,
          first_name: citizen.first_name,
          last_name: citizen.last_name,
          date_of_birth: citizen.date_of_birth,
          gender: citizen.gender,
          address: citizen.address || '',
          phone: citizen.phone || '',
          image_url: citizen.image_url,
          license_status: citizen.license_status as 'valid' | 'suspended' | 'revoked' | 'none',
          created_at: citizen.created_at,
        }));
        
        setCitizens(transformedData);
      } catch (error) {
        console.error('Error fetching citizens:', error);
        toast.error('فشل في جلب بيانات المواطنين');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCitizens();
  }, []);

  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setIsDialogOpen(true);
  };

  const handleAddCitizen = (newCitizen: Citizen) => {
    setCitizens([newCitizen, ...citizens]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">المواطنون</h2>
        <Button className="police-button" onClick={() => setIsAddDialogOpen(true)}>
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
      
      <CitizensList 
        citizens={citizens} 
        isLoading={isLoading} 
        searchQuery={searchQuery}
        onSelectCitizen={handleSelectCitizen}
      />
      
      {selectedCitizen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <CitizenDetails 
              citizen={selectedCitizen}
              formatDate={formatDate}
            />
          </DialogContent>
        </Dialog>
      )}

      <AddCitizenDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddCitizen={handleAddCitizen}
      />
    </div>
  );
};

export default CitizensPage;
