
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/dashboard");
      }
    };

    checkAuth();
  }, [navigate]);

  const createAdminAccount = async () => {
    try {
      setIsCreatingAdmin(true);
      
      // Create the admin user
      const { data, error } = await supabase.auth.signUp({
        email: "owner@admin.com",
        password: "admin123456",
        options: {
          data: {
            name: "مالك النظام",
          },
        },
      });

      if (error) throw error;

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("تم إنشاء حساب المسؤول بنجاح");
      toast.info("البريد الإلكتروني: owner@admin.com");
      toast.info("كلمة المرور: admin123456");
      
      // Redirect to login
      navigate("/login");
    } catch (error: any) {
      console.error("Error creating admin:", error);
      
      if (error.message.includes("User already registered")) {
        toast.info("حساب المسؤول موجود بالفعل، يرجى تسجيل الدخول");
        navigate("/login");
      } else {
        toast.error("حدث خطأ أثناء إنشاء حساب المسؤول");
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md space-y-6 px-4">
        <h1 className="text-4xl font-bold mb-4">نظام البيانات المتنقلة للشرطة</h1>
        <p className="text-xl text-muted-foreground mb-4">
          مرحبًا بك في نظام MDT. يجب إنشاء حساب المسؤول أولاً للبدء.
        </p>
        
        <div className="space-y-4">
          <Button 
            className="w-full police-button"
            onClick={createAdminAccount}
            disabled={isCreatingAdmin}
          >
            {isCreatingAdmin ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              'إنشاء حساب المسؤول'
            )}
          </Button>
          
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => navigate('/login')}
          >
            تسجيل الدخول للحساب الموجود
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
