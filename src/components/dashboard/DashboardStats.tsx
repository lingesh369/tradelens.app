
import { StatCard } from "@/components/dashboard/StatCard";
import { CircleDollarSign, Percent, TrendingUp } from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface DashboardStatsProps {
  stats: {
    netPnL: number;
    winRate: number;
    profitFactor: number;
    avgWinLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalWins: number;
    totalLosses: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const { settings } = useGlobalSettings();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 animate-fade-in animate-delay-1">
      <StatCard 
        title="Net P&L" 
        value={formatCurrencyValue(Math.abs(stats.netPnL), settings?.base_currency || "USD")}
        rawValue={stats.netPnL}
        isCurrency={true}
        description={stats.netPnL > 0 ? "Total profit" : "Total loss"} 
        icon={<CircleDollarSign />} 
        trend={stats.netPnL >= 0 ? "up" : "down"} 
        trendValue={`${(stats.netPnL / 100).toFixed(1)}%`} 
        valueClassName={stats.netPnL >= 0 ? "text-[hsl(var(--profit))]" : "text-[hsl(var(--loss))]"} 
      />
      <StatCard 
        title="Win Rate" 
        value={`${stats.winRate.toFixed(1)}%`} 
        description={`${stats.winningTrades} / ${stats.totalTrades} trades`} 
        icon={<Percent />} 
        trend="up" 
        trendValue={`${stats.winningTrades} wins`} 
      />
      <StatCard 
        title="Profit Factor" 
        value={stats.profitFactor.toFixed(2)} 
        description={`${formatCurrencyValue(stats.totalWins, settings?.base_currency || "USD")} : ${formatCurrencyValue(stats.totalLosses, settings?.base_currency || "USD")}`} 
        icon={<TrendingUp />} 
        trend={stats.profitFactor >= 1.5 ? "up" : "neutral"} 
        trendValue={stats.profitFactor >= 1.5 ? "Good" : "Average"} 
      />
      <StatCard 
        title="Avg Win/Loss" 
        value={stats.avgWinLoss.toFixed(2)} 
        description="Ratio of average win to average loss" 
        icon={<TrendingUp />} 
        trend={stats.avgWinLoss >= 1.5 ? "up" : stats.avgWinLoss >= 1 ? "neutral" : "down"} 
        trendValue={stats.avgWinLoss >= 1.5 ? "Good" : stats.avgWinLoss >= 1 ? "Average" : "Poor"} 
      />
    </div>
  );
}
