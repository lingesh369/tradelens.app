import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { AuthProvider } from "@/context/AuthContext";
import { FilterProvider } from "@/context/FilterContext";
import { ProtectedRoute } from "@/hooks/useAuth";
import { AccessWrapper } from "@/components/layout/AccessWrapper";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { GuardedRoute } from "@/components/subscription/GuardedRoute";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { NavigationProvider } from "@/context/NavigationContext";

// Pages
import Index from "./pages/Index";
import Features from "./pages/Features";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import Journal from "./pages/Journal";
import Notes from "./pages/Notes";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import EmailConfirmation from "./pages/EmailConfirmation";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Strategies from "./pages/Strategies";
import TradeDetailPage from "./pages/TradeDetailPage";
import Pricing from "./pages/Pricing";
import DirectPayment from "./pages/DirectPayment";
import Analytics from "./pages/Analytics";
import AICoPilot from "./pages/AICoPilot";
import Subscription from "./pages/Subscription";
import Checkout from "./pages/Checkout";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import CSVConverter from "./pages/CSVConverter";
import SharedTradePage from "./pages/SharedTradePage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import SalesDashboard from "./pages/admin/SalesDashboard";
import CouponsPage from "./pages/admin/CouponsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import AdminNotifications from "./pages/admin/AdminNotifications";
import { Community } from "./pages/Community";
import { TraderProfile } from "./pages/TraderProfile";

// Create query client outside of component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// External URL redirect component
const ExternalRedirect = ({ to }: { to: string }) => {
  const ref = localStorage.getItem("affiliateRef");
  
  useEffect(() => {
    // Append affiliate ref to external URLs if available
    if (ref && to.includes("peakify.store")) {
      const url = new URL(to);
      url.searchParams.set("ref", ref);
      window.location.href = url.toString();
    } else {
      window.location.href = to;
    }
  }, [to, ref]);
  return null;
};

// Placeholder components for new admin pages
const AdminSubscriptions = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Subscriptions Management</h1>
    <p className="text-muted-foreground">Subscription management interface will be implemented here.</p>
  </div>
);

const AdminAnalytics = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
    <p className="text-muted-foreground">Analytics dashboard will be implemented here.</p>
  </div>
);

const AdminSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
    <p className="text-muted-foreground">Admin settings interface will be implemented here.</p>
  </div>
);

const AdminSecurity = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Security Management</h1>
    <p className="text-muted-foreground">Security management interface will be implemented here.</p>
  </div>
);

function AppRoutes() {
  // Using the affiliate tracking hook
  useAffiliateTracking();
  
  // Get the upgrade modal component
  const { UpgradeModalComponent } = useUpgradeModal();

  // Register service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);
  
  return (
    <AccessWrapper>
      <Routes>
        {/* Public Routes */}
        <Route path="/home" element={<Index />} />
        <Route path="/features" element={<Features />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/sign-in" element={<Auth />} />
        <Route path="/auth/register" element={<Auth />} />
        <Route path="/auth/confirm-email" element={<EmailConfirmation />} />
        <Route path="/auth/verify-otp" element={<VerifyOTP />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<ExternalRedirect to="https://peakify.store/tradelens-pricing/" />} />
        <Route path="/direct-payment" element={<DirectPayment />} />
        <Route path="/payment/confirmation" element={<PaymentConfirmation />} />
        
        {/* Protected Routes - Using Route nesting with Outlet pattern */}
        <Route element={<ProtectedRoute />}>
          {/* Root route - Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Onboarding - Accessible to authenticated users */}
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Shared Trade Route - Requires authentication but accessible to all */}
          <Route path="/shared/trades/:tradeId" element={<SharedTradePage />} />
          
          {/* Always accessible routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/community" element={<Community />} />
          <Route path="/traders/:username" element={<TraderProfile />} />
          
          {/* Admin Routes - All require admin access */}
          <Route element={<GuardedRoute requiresAdmin={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/users/:username" element={<UserDetailPage />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/coupons" element={<CouponsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/sales" element={<SalesDashboard />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/security" element={<AdminSecurity />} />
          </Route>
          
          {/* Manager Routes */}
          <Route element={<GuardedRoute requiresManager={true} />}>
            {/* Add manager-only routes if needed */}
          </Route>
          
          {/* Routes that should be accessible for all valid subscribers (pro, starter, active trial) */}
          <Route element={<GuardedRoute />}>
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/trades/:tradeId" element={<TradeDetailPage />} />
            <Route path="/trades/:tradeId/from/:source" element={<TradeDetailPage />} />
            <Route path="/trades/:tradeId/from/:source/:contextId" element={<TradeDetailPage />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:date" element={<Journal />} />
            <Route path="/add-trade" element={<Trades />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/strategies/:strategyName" element={<Strategies />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai" element={<AICoPilot />} />
            <Route path="/csv" element={<CSVConverter />} />
          </Route>
        </Route>
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Render the upgrade modal component so it's available globally */}
      <UpgradeModalComponent />
    </AccessWrapper>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>

      <AuthProvider>
        <SubscriptionProvider>
          <FilterProvider>
            <ThemeToggle.Provider>
              <NavigationProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </NavigationProvider>
              <Toaster />
            </ThemeToggle.Provider>
          </FilterProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
