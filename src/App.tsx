
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CitizensPage from "@/pages/CitizensPage";
import ReportsPage from "@/pages/ReportsPage";
import AdminPage from "@/pages/AdminPage";
import CreateReportPage from "@/pages/CreateReportPage";
import NotFound from "@/pages/NotFound";

// Layouts
import DashboardLayout from "@/components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Dashboard layout with nested routes */}
            <Route path="/" element={<DashboardLayout />}>
              <Route path="" element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="citizens" element={<CitizensPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/create" element={<CreateReportPage />} />
              <Route path="admin/users" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
