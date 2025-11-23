
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardBottomSection } from '@/components/dashboard/DashboardBottomSection';
import { StatCard } from '@/components/dashboard/StatCard';
import { useTraderStats } from '@/hooks/useTraderStats';
import { useToast } from '@/hooks/use-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/hooks/useTrades';
import { cn } from '@/lib/utils';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { formatCurrencyValue } from '@/lib/currency-data';
import { isWithinInterval } from 'date-fns';

interface TraderOverviewTabProps {
  traderData: any;
  isOwner: boolean;
  accounts?: any[];
  trades?: Trade[];
  onVisibilityUpdate?: () => void;
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

export const TraderOverviewTab: React.FC<TraderOverviewTabProps> = ({
  traderData,
  isOwner,
  accounts: propAccounts = [],
  trades = [],
  onVisibilityUpdate
}) => {
  const { toast } = useToast();
  const { accounts: userAccounts } = useAccounts();
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

  // Use available accounts data
  const availableAccounts = isOwner ? userAccounts || [] : propAccounts;

  // Get privacy settings from trader profile data
  const privacySettings = traderData?.privacy_settings || {};
  
  // Get selected account IDs from privacy settings
  const selectedAccountIds = privacySettings.selected_account_ids || [];
  
  // Get date range from privacy settings or use default
  const savedDateRange = privacySettings.date_range ? {
    from: new Date(privacySettings.date_range.from),
    to: new Date(privacySettings.date_range.to),
    preset: privacySettings.date_range.preset || "thisYear"
  } : {
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
    preset: "thisYear" as const
  };

  console.log('TraderOverviewTab - Privacy Settings:', {
    selectedAccountIds,
    dateRange: savedDateRange,
    privacySettings
  });

  // Filter trades based on selected accounts and date range
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    
    let filtered = trades;
    
    // Filter by accounts from privacy settings (only if specific accounts are selected)
    if (selectedAccountIds.length > 0) {
      filtered = filtered.filter(trade => selectedAccountIds.includes(trade.account_id));
    }
    
    // Filter by date range from privacy settings
    if (savedDateRange) {
      filtered = filtered.filter(trade => {
        if (!trade.entry_time) return false;
        const tradeDate = new Date(trade.entry_time);
        return isWithinInterval(tradeDate, {
          start: savedDateRange.from,
          end: savedDateRange.to
        });
      });
    }
    
    return filtered;
  }, [trades, selectedAccountIds, savedDateRange]);

  // Calculate stats using the filtered trades
  const stats = useTraderStats({
    trades: filteredTrades,
  });

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

  const hasRealTrades = filteredTrades && filteredTrades.length > 0;
  const allAccounts = selectedAccountIds.length === 0;

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

      {/* Debug Info for Owner */}
      {isOwner && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          <div>Selected Accounts: {selectedAccountIds.length === 0 ? 'All' : selectedAccountIds.join(', ')}</div>
          <div>Date Range: {savedDateRange.from.toLocaleDateString()} - {savedDateRange.to.toLocaleDateString()}</div>
          <div>Filtered Trades: {filteredTrades.length}</div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
        <BlurredCard isVisible={visibility.net_pnl} title="Net P&L">
          <StatCard
            title="Net P&L"
            value={formatCurrency(stats.netPnL)}
            rawValue={stats.netPnL}
            isCurrency={true}
            valueClassName={stats.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}
            className="p-3"
          />
        </BlurredCard>
        
        <BlurredCard isVisible={visibility.win_rate} title="Win Rate">
          <StatCard
            title="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            valueClassName={stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}
            className="p-3"
          />
        </BlurredCard>
        
        <BlurredCard isVisible={visibility.profit_factor} title="Profit Factor">
          <StatCard
            title="Profit Factor"
            value={stats.profitFactor.toFixed(2)}
            valueClassName={stats.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}
            className="p-3"
          />
        </BlurredCard>
        
        <BlurredCard isVisible={visibility.avg_win_loss} title="Avg Win/Loss">
          <StatCard
            title="Avg Win/Loss"
            value={stats.avgWinLoss.toFixed(2)}
            valueClassName={stats.avgWinLoss >= 1 ? 'text-green-600' : 'text-red-600'}
            className="p-3"
          />
        </BlurredCard>

        <BlurredCard isVisible={true} title="Total Trades">
          <StatCard
            title="Total Trades"
            value={stats.totalTrades.toString()}
            className="p-3"
          />
        </BlurredCard>

        <BlurredCard isVisible={visibility.avg_win_loss} title="Avg Win/Loss Details">
          <StatCard
            title="Avg Win/Loss"
            value={
              <div className="space-y-1">
                <div className="text-green-600 text-lg font-bold">
                  Win: {formatCurrency(stats.avgWin)}
                </div>
                <div className="text-red-600 text-lg font-bold">
                  Loss: {formatCurrency(stats.avgLoss)}
                </div>
              </div>
            }
            className="p-3"
          />
        </BlurredCard>
      </div>

      {/* Dashboard Charts */}
      <BlurredCard isVisible={visibility.daily_pnl} title="Charts">
        <DashboardCharts
          filteredTrades={filteredTrades}
          accounts={availableAccounts}
          dateRange={savedDateRange}
          hasRealTrades={hasRealTrades}
          selectedAccountIds={selectedAccountIds}
          allAccounts={allAccounts}
        />
      </BlurredCard>

      {/* Calendar View */}
      <BlurredCard isVisible={visibility.calendar_view} title="Calendar">
        <DashboardBottomSection
          filteredTrades={filteredTrades}
          onCalendarDateClick={() => {}} // Disabled for trader profiles
        />
      </BlurredCard>
    </div>
  );
};
