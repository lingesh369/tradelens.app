
import React from 'react';
import { Users, UserCheck, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';

interface AdminUsersMetricsProps {
  metrics: {
    newUsers: number;
    activeTrials: number;
    paidConversions: number;
  };
  isLoading?: boolean;
}

export const AdminUsersMetrics: React.FC<AdminUsersMetricsProps> = ({ 
  metrics, 
  isLoading = false 
}) => {
  const metricsData = [
    { 
      title: 'New Users (30d)', 
      value: metrics.newUsers.toString(), 
      change: '+12.5%', 
      icon: <Users /> 
    },
    { 
      title: 'Active Trials', 
      value: metrics.activeTrials.toString(), 
      change: '+8.3%', 
      icon: <UserCheck /> 
    },
    { 
      title: 'Paid Conversions (30d)', 
      value: metrics.paidConversions.toString(), 
      change: '+15.2%', 
      icon: <TrendingUp /> 
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
      {isLoading 
        ? Array.from({ length: 3 }).map((_, index) => (
           <div key={index} className="glass-card rounded-xl p-5">
             <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-5 w-5 rounded-full" />
             </div>
             <div className="mt-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
             </div>
           </div>
          ))
        : metricsData.map((metric, index) => (
            <StatCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={React.cloneElement(metric.icon, { className: 'h-5 w-5 text-muted-foreground' })}
              trend={metric.change.startsWith('+') ? 'up' : 'down'}
              trendValue={metric.change}
              description="vs last 30 days"
            />
      ))}
    </div>
  );
};
