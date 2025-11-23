
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { Coupon } from '@/types/coupon';

const MetricCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export const CouponsMetrics = ({ coupons }: { coupons: Coupon[] }) => {
  const metrics = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter(c => c.status === 'active').length,
    expiredCoupons: coupons.filter(c => c.status === 'expired').length,
    usedCoupons: coupons.reduce((acc, c) => acc + (c.used_count || 0), 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="Total Coupons" value={metrics.totalCoupons} icon={Ticket} />
      <MetricCard title="Active Coupons" value={metrics.activeCoupons} icon={CheckCircle} />
      <MetricCard title="Expired Coupons" value={metrics.expiredCoupons} icon={XCircle} />
      <MetricCard title="Total Times Used" value={metrics.usedCoupons} icon={ShoppingCart} />
    </div>
  );
};
