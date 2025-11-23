
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { NetDailyPnLChart } from "@/components/dashboard/NetDailyPnLChart";
import { Trade } from "@/hooks/useTrades";
import { Account } from "@/hooks/useAccounts";
import { DateRange } from "@/components/filters/DateRangeTypes";

interface DashboardChartsProps {
  filteredTrades: Trade[];
  accounts: Account[];
  dateRange: DateRange;
  hasRealTrades: boolean;
  selectedAccountIds: string[];
  allAccounts: boolean;
}

export function DashboardCharts({ 
  filteredTrades, 
  accounts, 
  dateRange, 
  hasRealTrades,
  selectedAccountIds,
  allAccounts
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-fade-in animate-delay-2">
      <PerformanceChart 
        title="Account Balance" 
        description="Cumulative P&L over time" 
        className="w-full aspect-[16/10] md:aspect-[16/9]" 
        trades={filteredTrades} 
        accounts={allAccounts ? accounts : accounts.filter(acc => selectedAccountIds.includes(acc.account_id))} 
        dateRange={dateRange}
        hasRealTrades={hasRealTrades}
      />
      <NetDailyPnLChart 
        className="w-full aspect-[16/10] md:aspect-[16/9]" 
        trades={filteredTrades} 
        dateRange={dateRange}
        hasRealTrades={hasRealTrades}
      />
    </div>
  );
}
