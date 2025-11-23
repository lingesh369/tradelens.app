import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { NetDailyPnLChart } from '@/components/dashboard/NetDailyPnLChart';
import { FullScreenCalendarView } from '@/components/ui/fullscreen-calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { formatCurrencyValue } from '@/lib/currency-data';

interface PublicProfileAnalytics {
  netPnL?: number;
  winRate?: number;
  profitFactor?: number;
  avgWinLoss?: number;
  totalTrades: number;
  winningTrades?: number;
  losingTrades?: number;
  grossProfit?: number;
  grossLoss?: number;
  avgWin?: number;
  avgLoss?: number;
  largestWin?: number;
  largestLoss?: number;
  consecutiveWins?: number;
  consecutiveLosses?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  calmarRatio?: number;
  expectancy?: number;
}

interface PublicProfileAnalyticsResponse {
  data: PublicProfileAnalytics;
  appliedFilters: {
    accountIds: string[];
    dateRange: {
      from: string | null;
      to: string | null;
    };
  };
}

interface PublicTraderOverviewTabProps {
  traderData: any;
  isOwner: boolean;
  analyticsData?: PublicProfileAnalyticsResponse;
  isLoadingAnalytics?: boolean;
  analyticsError?: Error | null;
  onVisibilityUpdate?: () => void;
  trades?: any[]; // Shared trades data
  accounts?: any[]; // Account data for the trader
}

interface StatsVisibility {
  [key: string]: boolean;
  net_pnl: boolean;
  win_rate: boolean;
  profit_factor: boolean;
  avg_win_loss: boolean;
  account_balance: boolean;
  daily_pnl: boolean;
  recent_trades: boolean;
  calendar_view: boolean;
}

export const PublicTraderOverviewTab: React.FC<PublicTraderOverviewTabProps> = ({
  traderData,
  isOwner,
  analyticsData,
  isLoadingAnalytics,
  analyticsError,
  onVisibilityUpdate,
  trades = [],
  accounts = []
}) => {
  const { toast } = useToast();
  const { settings } = useGlobalSettings();
  
  const [isEditingVisibility, setIsEditingVisibility] = useState(false);
  
  const [visibility, setVisibility] = useState<StatsVisibility>(
    traderData?.stats_visibility || {
      net_pnl: false,
      win_rate: true,
      profit_factor: true,
      avg_win_loss: true,
      account_balance: false,
      daily_pnl: true,
      recent_trades: true,
      calendar_view: true
    }
  );

  const handleSaveVisibility = async () => {
    try {
      const { error } = await supabase
        .from('trader_profiles')
        .update({ stats_visibility: visibility })
        .eq('user_id', traderData?.user_id);

      if (error) throw error;

      toast({
        title: "Visibility settings updated",
        description: "Your stats sharing preferences have been saved.",
      });
      
      setIsEditingVisibility(false);
      onVisibilityUpdate?.();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update visibility settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const BlurredCard: React.FC<{
    children: React.ReactNode;
    isVisible: boolean;
    title: string;
  }> = ({ children, isVisible, title }) => {
    if (isVisible || isOwner) {
      return <>{children}</>;
    }
    
    return (
      <div className="relative">
        <div className="filter blur-md pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-2">
            <EyeOff className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">{title} Hidden</p>
            <p className="text-xs text-muted-foreground">This trader has chosen to keep this private</p>
          </div>
        </div>
      </div>
    );
  };

  const visibilityControls = [
    { key: 'net_pnl', label: 'Net P&L', description: 'Total profit and loss' },
    { key: 'win_rate', label: 'Win Rate', description: 'Percentage of winning trades' },
    { key: 'profit_factor', label: 'Profit Factor', description: 'Ratio of gross profit to gross loss' },
    { key: 'avg_win_loss', label: 'Avg Win/Loss', description: 'Average win to average loss ratio' },
    { key: 'account_balance', label: 'Account Balance', description: 'Current account balances' },
    { key: 'daily_pnl', label: 'Daily P&L Chart', description: 'Daily profit and loss chart' },
    { key: 'recent_trades', label: 'Recent Trades', description: 'List of recent trading activity' },
    { key: 'calendar_view', label: 'Calendar View', description: 'Trading calendar with performance' }
  ];

  const formatCurrency = (value: number) => {
    return formatCurrencyValue(value, settings?.base_currency || 'USD');
  };

  // Get analytics data
  const analytics = analyticsData?.data;
  const appliedFilters = analyticsData?.appliedFilters;

  if (isLoadingAnalytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-red-500">
          <p>Error loading analytics: {analyticsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Settings Button - Only for owner */}
      {isOwner && (
        <div className="flex justify-end">
          <Dialog open={isEditingVisibility} onOpenChange={setIsEditingVisibility}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Privacy Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Stats Sharing Preferences</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {visibilityControls.map((control) => (
                  <div key={control.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor={control.key} className="text-sm font-medium">
                        {control.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {control.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={control.key}
                        checked={visibility[control.key as keyof StatsVisibility]}
                        onCheckedChange={(checked) =>
                          setVisibility((prev) => ({
                            ...prev,
                            [control.key]: checked,
                          }))
                        }
                      />
                      {visibility[control.key as keyof StatsVisibility] ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditingVisibility(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveVisibility}>Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Applied Filters Info */}
      {appliedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Applied Filters</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              <strong>Accounts:</strong> {appliedFilters.accountIds.length === 0 ? 'All accounts' : `${appliedFilters.accountIds.length} selected`}
            </div>
            <div>
              <strong>Date Range:</strong> {appliedFilters.dateRange.from && appliedFilters.dateRange.to 
                ? `${new Date(appliedFilters.dateRange.from).toLocaleDateString()} - ${new Date(appliedFilters.dateRange.to).toLocaleDateString()}`
                : 'All time'
              }
            </div>
            <div>
              <strong>Total Trades:</strong> {analytics?.totalTrades || 0}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview - Only Main Metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
        <BlurredCard isVisible={visibility.net_pnl} title="Net P&L">
          <StatCard
            title="Net P&L"
            value={analytics?.netPnL !== undefined ? formatCurrency(analytics.netPnL) : 'Hidden'}
            rawValue={analytics?.netPnL}
            isCurrency={true}
            valueClassName={analytics?.netPnL !== undefined ? (analytics.netPnL >= 0 ? 'text-green-600' : 'text-red-600') : ''}
            className="p-3"
          />
        </BlurredCard>
        
        <BlurredCard isVisible={visibility.win_rate} title="Win Rate">
          <StatCard
            title="Win Rate"
            value={analytics?.winRate !== undefined && analytics?.winRate !== null ? `${analytics.winRate.toFixed(1)}%` : 'Hidden'}
            valueClassName={analytics?.winRate !== undefined && analytics?.winRate !== null ? (analytics.winRate >= 50 ? 'text-green-600' : 'text-red-600') : ''}
            className="p-3"
          />
        </BlurredCard>
        
        <BlurredCard isVisible={visibility.profit_factor} title="Profit Factor">
          <StatCard
            title="Profit Factor"
            value={analytics?.profitFactor !== undefined && analytics?.profitFactor !== null ? analytics.profitFactor.toFixed(2) : 'Hidden'}
            valueClassName={analytics?.profitFactor !== undefined && analytics?.profitFactor !== null ? (analytics.profitFactor >= 1 ? 'text-green-600' : 'text-red-600') : ''}
            className="p-3"
          />
        </BlurredCard>
        
        <BlurredCard isVisible={visibility.avg_win_loss} title="Avg Win/Loss">
          <StatCard
            title="Avg Win/Loss"
            value={analytics?.avgWinLoss !== undefined && analytics?.avgWinLoss !== null ? analytics.avgWinLoss.toFixed(2) : 'Hidden'}
            valueClassName={analytics?.avgWinLoss !== undefined && analytics?.avgWinLoss !== null ? (analytics.avgWinLoss >= 1 ? 'text-green-600' : 'text-red-600') : ''}
            className="p-3"
          />
        </BlurredCard>

        <BlurredCard isVisible={true} title="Total Trades">
          <StatCard
            title="Total Trades"
            value={analytics?.totalTrades?.toString() || '0'}
            className="p-3"
          />
        </BlurredCard>

        <BlurredCard isVisible={visibility.avg_win_loss} title="Avg Win/Loss Details">
          <StatCard
            title="Avg Win/Loss"
            value={
              analytics?.avgWin !== undefined && analytics?.avgWin !== null && 
              analytics?.avgLoss !== undefined && analytics?.avgLoss !== null ? (
                <div className="space-y-1">
                  <div className="text-green-600 text-lg font-bold">
                    Win: {formatCurrency(analytics.avgWin)}
                  </div>
                  <div className="text-red-600 text-lg font-bold">
                    Loss: {formatCurrency(analytics.avgLoss)}
                  </div>
                </div>
              ) : 'Hidden'
            }
            className="p-3"
          />
        </BlurredCard>
      </div>

      {/* Dashboard Charts */}
      <BlurredCard isVisible={visibility.daily_pnl} title="Charts">
        <div className="animate-fade-in animate-delay-2">
          <NetDailyPnLChart 
            className="w-full aspect-[16/10] md:aspect-[16/9]" 
            trades={trades}
            hasRealTrades={trades.length > 0}
          />
        </div>
      </BlurredCard>

      {/* Calendar View */}
      <BlurredCard isVisible={visibility.calendar_view} title="Calendar">
        <div className="animate-fade-in animate-delay-3">
          <FullScreenCalendarView 
            className="h-[400px] md:h-[500px] xl:h-[550px]" 
            trades={trades}
            onDateClick={() => {}} // Disabled for public profiles
          />
        </div>
      </BlurredCard>

      {/* No Data Message */}
      {!analytics || analytics.totalTrades === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Trading Data</h3>
            <p className="text-muted-foreground">
              {isOwner 
                ? "Start trading and sharing your trades to see analytics here."
                : "This trader hasn't shared any trading data yet."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};