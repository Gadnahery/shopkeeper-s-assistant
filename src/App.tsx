import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
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
import Todo from "./pages/Todo";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { CommandPalette } from "./components/CommandPalette";
import { hasValidSupabaseEnv } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

function EnvSetupMessage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Setup required</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Add <code className="rounded bg-muted px-1.5 py-0.5">VITE_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code> to your{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">.env</code> file, then restart the dev server.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Copy <code className="rounded bg-muted px-1 py-0.5">.env.example</code> to <code className="rounded bg-muted px-1 py-0.5">.env</code> and fill in your Supabase credentials.
      </p>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    {!hasValidSupabaseEnv ? (
      <EnvSetupMessage />
    ) : (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth" element={<Auth />} />
              
              <Route element={<><CommandPalette /><MainLayout /></>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/terminal" element={<POSTerminal />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/add" element={<AddProduct />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/todo" element={<Todo />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/hrm" element={<HRM />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
    )}
  </QueryClientProvider>
);

export default App;
