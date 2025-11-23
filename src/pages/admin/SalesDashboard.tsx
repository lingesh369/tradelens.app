
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { BarChart } from '@/components/ui/bar-chart';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  CreditCard
} from 'lucide-react';

interface SalesMetric {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: string;
}

const SalesDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    activeSubscriptions: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    churnRate: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchSalesMetrics = async () => {
      setIsLoading(true);

      try {
        // Get total revenue from payments
        const { data: allPayments } = await supabase
          .from('payments')
          .select('amount, created_at, payment_status');

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        if (allPayments) {
          allPayments.forEach(payment => {
            if (payment.payment_status === 'completed') {
              totalRevenue += payment.amount || 0;
              
              const paymentDate = new Date(payment.created_at);
              if (
                paymentDate.getMonth() === currentMonth && 
                paymentDate.getFullYear() === currentYear
              ) {
                monthlyRevenue += payment.amount || 0;
              }
            }
          });
        }

        // Get customer count
        const { count: totalCustomers } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions
        const { count: activeSubscriptions } = await supabase
          .from('user_subscriptions_new')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Calculate average order value
        const averageOrderValue = allPayments?.length ? totalRevenue / allPayments.length : 0;

        // Get recent customers
        const { data: recentCustomersData } = await supabase
          .from('app_users')
          .select('email, first_name, last_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentCustomersData) {
          const formattedCustomers = recentCustomersData.map(customer => ({
            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A',
            email: customer.email,
            joinDate: new Date(customer.created_at).toLocaleDateString()
          }));
          setRecentCustomers(formattedCustomers);
        }

        setMetrics({
          totalRevenue,
          monthlyRevenue,
          totalCustomers: totalCustomers || 0,
          activeSubscriptions: activeSubscriptions || 0,
          conversionRate: totalCustomers ? (activeSubscriptions || 0) / totalCustomers * 100 : 0,
          averageOrderValue,
          churnRate: 5.2 // Mock data
        });
      } catch (error) {
        console.error('Error fetching sales metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const salesMetrics: SalesMetric[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      description: 'All time revenue'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(metrics.monthlyRevenue),
      icon: <Calendar className="h-6 w-6 text-blue-500" />,
      description: 'Current month'
    },
    {
      title: 'Total Customers',
      value: metrics.totalCustomers,
      icon: <Users className="h-6 w-6 text-purple-500" />,
      description: 'Registered users'
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      icon: <Award className="h-6 w-6 text-orange-500" />,
      description: 'Currently active'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
      description: 'Users to subscribers'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(metrics.averageOrderValue),
      icon: <CreditCard className="h-6 w-6 text-indigo-500" />,
      description: 'Per transaction'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-muted-foreground">
            Track revenue, subscriptions, and customer metrics
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {salesMetrics.map((metric, index) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart
                  data={[
                    { name: 'Jan', value: 1200 },
                    { name: 'Feb', value: 1800 },
                    { name: 'Mar', value: 2400 },
                    { name: 'Apr', value: 2200 },
                    { name: 'May', value: 2800 },
                    { name: 'Jun', value: metrics.monthlyRevenue }
                  ]}
                  index="name"
                  categories={['value']}
                  colors={['blue']}
                  valueFormatter={(value) => formatCurrency(Number(value))}
                  showLegend={false}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {customer.joinDate}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SalesDashboard;
