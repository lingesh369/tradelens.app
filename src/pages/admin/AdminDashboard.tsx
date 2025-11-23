
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  UserCheck,
  Award,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
// Import from bar-chart.tsx instead of chart.tsx
import { BarChart } from '@/components/ui/bar-chart';

interface DashboardMetric {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: string;
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<{
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    starterUsers: number;
    proUsers: number;
    expiringTrials: number;
    recentUpgrades: number;
    totalRevenue: number;
    monthRevenue: number;
  }>({
    totalUsers: 0,
    activeUsers: 0,
    trialUsers: 0,
    starterUsers: 0,
    proUsers: 0,
    expiringTrials: 0,
    recentUpgrades: 0,
    totalRevenue: 0,
    monthRevenue: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);

      try {
        const { count: totalUsers } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: activeUsers } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', sevenDaysAgo.toISOString());

        // Get subscription data using the correct approach
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions_new')
          .select(`
            subscription_plans (name)
          `)
          .eq('status', 'active');

        let trialUsers = 0;
        let starterUsers = 0;
        let proUsers = 0;

        if (subscriptionData) {
          subscriptionData.forEach(sub => {
            const planName = (sub as any).subscription_plans?.name;
            if (planName === 'Free Trial') trialUsers++;
            else if (planName === 'Starter') starterUsers++;
            else if (planName === 'Pro') proUsers++;
          });
        }

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        const { count: expiringTrials } = await supabase
          .from('user_subscriptions_new')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('end_date', 'is', null)
          .lt('end_date', threeDaysFromNow.toISOString())
          .gt('end_date', new Date().toISOString());

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: recentUpgrades } = await supabase
          .from('user_subscriptions_new')
          .select('*', { count: 'exact', head: true })
          .in('status', ['active'])
          .gte('start_date', thirtyDaysAgo.toISOString());

        const { data: allPayments } = await supabase
          .from('payments')
          .select('amount, created_at');

        let totalRevenue = 0;
        let monthRevenue = 0;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        if (allPayments) {
          allPayments.forEach(payment => {
            totalRevenue += payment.amount || 0;
            
            const paymentDate = new Date(payment.created_at);
            if (
              paymentDate.getMonth() === currentMonth && 
              paymentDate.getFullYear() === currentYear
            ) {
              monthRevenue += payment.amount || 0;
            }
          });
        }

        setMetrics({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          trialUsers,
          starterUsers,
          proUsers,
          expiringTrials: expiringTrials || 0,
          recentUpgrades: recentUpgrades || 0,
          totalRevenue,
          monthRevenue
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const dashboardMetrics: DashboardMetric[] = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: <Users className="h-6 w-6 text-blue-500" />,
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      icon: <UserCheck className="h-6 w-6 text-green-500" />,
      description: 'Past 7 days'
    },
    {
      title: 'Pro Users',
      value: metrics.proUsers,
      icon: <Award className="h-6 w-6 text-purple-500" />
    },
    {
      title: 'Trials Expiring Soon',
      value: metrics.expiringTrials,
      icon: <Clock className="h-6 w-6 text-orange-500" />,
      description: 'Next 3 days'
    },
    {
      title: 'Recent Upgrades',
      value: metrics.recentUpgrades,
      icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
      description: 'Past 30 days'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: <DollarSign className="h-6 w-6 text-emerald-500" />
    },
    {
      title: 'Revenue This Month',
      value: formatCurrency(metrics.monthRevenue),
      icon: <Calendar className="h-6 w-6 text-blue-500" />
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            TradeLens admin dashboard overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dashboardMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                {metric.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>User Plans Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart
                  data={[
                    { name: 'Trial', value: metrics.trialUsers },
                    { name: 'Starter', value: metrics.starterUsers },
                    { name: 'Pro', value: metrics.proUsers }
                  ]}
                  index="name"
                  categories={['value']}
                  colors={['blue']}
                  valueFormatter={(value) => `${value} users`}
                  showLegend={false}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading user growth data...
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
