import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PWAProvider } from "@/contexts/PWAContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { PWAUpdateBanner } from "@/components/pwa/PWAUpdateBanner";
import { RouteSeo } from "@/components/seo/RouteSeo";
import { MainLayout } from "@/components/layout/MainLayout";
import { CommandPalette } from "./components/CommandPalette";
import { hasValidSupabaseEnv } from "@/integrations/supabase/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Auth = lazy(() => import("./pages/Auth"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AuthConfirmPage = lazy(() => import("./pages/AuthConfirmPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const GoogleOnboardingPage = lazy(() => import("./pages/GoogleOnboardingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Sales = lazy(() => import("./pages/Sales"));
const Inventory = lazy(() => import("./pages/Inventory"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const ReceiveStock = lazy(() => import("./pages/ReceiveStock"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetail = lazy(() => import("./pages/SupplierDetail"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Reports = lazy(() => import("./pages/Reports"));
const Loyalty = lazy(() => import("./pages/Loyalty"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Billing = lazy(() => import("./pages/Billing"));
const HRM = lazy(() => import("./pages/HRM"));
const Assets = lazy(() => import("./pages/Assets"));
const Categories = lazy(() => import("./pages/Categories"));
const Orders = lazy(() => import("./pages/Orders"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Production = lazy(() => import("./pages/Production"));
const Todo = lazy(() => import("./pages/Todo"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

function RouteFallback() {
  return (
    <div className="flex min-h-[280px] items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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

function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
            <SubscriptionProvider>
              <NotificationProvider>
                <PWAProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <PWAUpdateBanner />
                    <BrowserRouter>
                      <RouteSeo />
                      <Suspense fallback={<AppLoader />}>
                        <Routes>
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/features" element={<FeaturesPage />} />
                          <Route path="/pricing" element={<PricingPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route path="/auth/confirm" element={<AuthConfirmPage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/signup" element={<SignupPage />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/auth/oauth-setup" element={<GoogleOnboardingPage />} />

                          <Route element={<ProtectedRoute><><CommandPalette /><ErrorBoundary><MainLayout /></ErrorBoundary></></ProtectedRoute>}>
                            <Route path="/billing" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Billing /></Suspense></ProtectedRoute>} />
                            <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Dashboard /></Suspense></ProtectedRoute>} />
                            <Route path="/purchases" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Purchases /></Suspense></ProtectedRoute>} />
                            <Route path="/production" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Production /></Suspense></ProtectedRoute>} />
                            <Route path="/sales" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Sales /></Suspense></ProtectedRoute>} />
                            <Route path="/sales/terminal" element={<Navigate to="/sales" replace />} />
                            <Route path="/inventory" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Inventory /></Suspense></ProtectedRoute>} />
                            <Route path="/inventory/add" element={<ProtectedRoute allowedRoles={["owner", "manager", "staff"]}><Suspense fallback={<RouteFallback />}><AddProduct /></Suspense></ProtectedRoute>} />
                            <Route path="/inventory/receive" element={<ProtectedRoute allowedRoles={["owner", "manager", "staff"]}><Suspense fallback={<RouteFallback />}><ReceiveStock /></Suspense></ProtectedRoute>} />
                            <Route path="/categories" element={<ProtectedRoute allowedRoles={["owner", "manager", "staff"]}><Suspense fallback={<RouteFallback />}><Categories /></Suspense></ProtectedRoute>} />
                            <Route path="/orders" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Orders /></Suspense></ProtectedRoute>} />
                            <Route path="/todo" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Todo /></Suspense></ProtectedRoute>} />
                            <Route path="/customers" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Customers /></Suspense></ProtectedRoute>} />
                            <Route path="/customers/:id" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><CustomerDetail /></Suspense></ProtectedRoute>} />
                            <Route path="/suppliers" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Suppliers /></Suspense></ProtectedRoute>} />
                            <Route path="/suppliers/:id" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><SupplierDetail /></Suspense></ProtectedRoute>} />
                            <Route path="/expenses" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Expenses /></Suspense></ProtectedRoute>} />
                            <Route path="/hrm" element={<ProtectedRoute allowedRoles={["owner", "manager", "hr"]}><Suspense fallback={<RouteFallback />}><HRM /></Suspense></ProtectedRoute>} />
                            <Route path="/user-management" element={<ProtectedRoute allowedRoles={["owner", "manager"]}><Suspense fallback={<RouteFallback />}><UserManagement /></Suspense></ProtectedRoute>} />
                            <Route path="/assets" element={<ProtectedRoute allowedRoles={["owner", "manager"]}><Suspense fallback={<RouteFallback />}><Assets /></Suspense></ProtectedRoute>} />
                            <Route path="/reports" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Reports /></Suspense></ProtectedRoute>} />
                            <Route path="/loyalty" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Loyalty /></Suspense></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><Notifications /></Suspense></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute allowedRoles={["owner", "manager"]}><Suspense fallback={<RouteFallback />}><Settings /></Suspense></ProtectedRoute>} />
                          </Route>

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </TooltipProvider>
                </PWAProvider>
              </NotificationProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    )}
  </QueryClientProvider>
);

export default App;
