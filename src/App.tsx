import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import POSTerminal from "./pages/POSTerminal";
import Inventory from "./pages/Inventory";
import AddProduct from "./pages/AddProduct";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import HRM from "./pages/HRM";
import Assets from "./pages/Assets";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/terminal" element={<POSTerminal />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/add" element={<AddProduct />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/hrm" element={<HRM />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
