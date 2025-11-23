
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getAdminUserByUsername, updateUserStatus, getUserStats, getCompleteUserSettings, getUserPayments } from '@/lib/admin-utils';
import { UserDetailHeaderCard } from '@/components/admin/user-detail/UserDetailHeaderCard';
import { UserActivityTab } from '@/components/admin/user-detail/UserActivityTab';
import { UserSubscriptionTab } from '@/components/admin/user-detail/UserSubscriptionTab';
import { UserTradingTab } from '@/components/admin/user-detail/UserTradingTab';
import { UserSettingsTab } from '@/components/admin/user-detail/UserSettingsTab';
import { UserLogsTab } from '@/components/admin/user-detail/UserLogsTab';

interface UserDetails {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  signup_date: string | null;
  last_login: string | null;
  user_status: string;
  user_role: string;
  subscription_plan: string;
  days_left: number;
  location: string;
  timezone: string;
  subscription_id: string | null;
  start_date: string | null;
  next_billing_date: string | null;

  payment_method: string | null;
  end_date?: string | null;
}

interface UserStats {
  net_pnl: string | number;
  win_rate: string | number;
  trades_count: number;
  last_trade_logged: string;
  accounts_count: number;
  strategies_count: number;
}


const UserDetailPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userSettings, setUserSettings] = useState<any | null>(null);
  const [userPayments, setUserPayments] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (!username) return;

    setIsLoading(true);
    setIsStatsLoading(true);
    setIsSettingsLoading(true);
    setIsPaymentsLoading(true);
    try {
        const { data: userData, error: userError } = await getAdminUserByUsername(username);

        if (userError) throw userError;
        if (!userData) throw new Error('User not found');
        
        setUserDetails(userData);
        setIsLoading(false);

        const userId = userData.user_id;

        const [statsResult, settingsResult, paymentsResult] = await Promise.all([
          getUserStats(userId),
          getCompleteUserSettings(userId),
          getUserPayments(userId),
        ]);

        if (statsResult.error) throw statsResult.error;
        setUserStats(statsResult.data);
        
        if (settingsResult.error) console.error('Could not load user settings', settingsResult.error);
        setUserSettings(settingsResult.data);

        if (paymentsResult.error) throw new Error('Failed to load payment history');
        setUserPayments(paymentsResult.data);

      } catch (error) {
        console.error('Error fetching user details page data:', error);
        toast({
          title: "Error",
          description: "Failed to load all user data.",
          variant: "destructive"
        });
      } finally {
        setIsStatsLoading(false);
        setIsSettingsLoading(false);
        setIsPaymentsLoading(false);
      }
  }, [username, toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleBanUser = async () => {
    if (!userDetails || !userDetails.user_id) return;
    try {
      setIsProcessing(true);
      const newStatus = userDetails.user_status === 'Active' ? 'Suspended' : 'Active';
      
      const result = await updateUserStatus(userDetails.user_id, newStatus);
      
      if (result.success) {
        setUserDetails(prev => prev ? { ...prev, user_status: newStatus } : null);
        toast({
          title: `User ${newStatus}`,
          description: `User has been successfully ${newStatus.toLowerCase()}.`
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update user status: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!userDetails) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <Button onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/users">Users</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{userDetails.username}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <UserDetailHeaderCard userDetails={userDetails} isProcessing={isProcessing} handleBanUser={handleBanUser} />

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="activity">Account Activity</TabsTrigger>
            <TabsTrigger value="subscription">Subscription & Billing</TabsTrigger>
            <TabsTrigger value="trading">Trading Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <UserActivityTab userDetails={userDetails} />
          </TabsContent>
          <TabsContent value="subscription">
            <UserSubscriptionTab 
              userDetails={userDetails} 
              payments={userPayments} 
              isLoadingPayments={isPaymentsLoading}
              onSubscriptionUpdate={fetchAllData}
            />
          </TabsContent>
          <TabsContent value="trading">
            <UserTradingTab stats={userStats} isLoading={isStatsLoading} />
          </TabsContent>
          <TabsContent value="settings">
            <UserSettingsTab settings={userSettings} isLoading={isSettingsLoading} />
          </TabsContent>
          <TabsContent value="logs">
            <UserLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default UserDetailPage;
