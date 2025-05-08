
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page
    navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">جاري التحميل...</h1>
        <p className="text-xl text-muted-foreground">نظام البيانات المتنقلة للشرطة</p>
      </div>
    </div>
  );
};

export default Index;
