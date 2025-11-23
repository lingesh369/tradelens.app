
import { useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { DummyDataBanner } from "@/components/onboarding/DummyDataBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardBottomSection } from "@/components/dashboard/DashboardBottomSection";
import { Loader2 } from "lucide-react";
import { useTrades } from "@/hooks/useTrades";
import { useAccounts } from "@/hooks/useAccounts";
import { usePlanInfo } from "@/hooks/usePlanInfo";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useGlobalFilters } from "@/context/FilterContext";
import { getDummyDataBanners } from "@/utils/dummyData";

const Dashboard = () => {
  const { trades, isLoading: tradesLoading, refetch, hasRealTrades } = useTrades();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const planInfo = usePlanInfo();
  const navigate = useNavigate();
  const { filters } = useGlobalFilters();
  
  // Get dummy data banners
  const banners = getDummyDataBanners();
  
  // Filter trades using useMemo for immediate reactivity
  const filteredTrades = useMemo(() => {
    if (trades.length === 0) return trades;
    
    console.log("Dashboard filtering trades with global filters:", filters);
    const filtered = trades.filter(trade => {
      if (trade.entry_time && filters.dateRange.from && filters.dateRange.to) {
        const tradeDate = new Date(trade.entry_time);
        const filterFrom = startOfDay(filters.dateRange.from);
        const filterTo = endOfDay(filters.dateRange.to);
        
        const dateMatches = isWithinInterval(tradeDate, {
          start: filterFrom,
          end: filterTo
        });
        
        if (!dateMatches) return false;
      }

      // Account filter
      if (!filters.selectedAccounts.allAccounts) {
        const accountMatches = trade.account_id ? filters.selectedAccounts.accountIds.includes(trade.account_id) : false;
        if (!accountMatches) return false;
      }

      return true;
    });
    
    console.log("Dashboard filtered trades:", filtered);
    return filtered;
  }, [trades, filters.dateRange.from, filters.dateRange.to, filters.selectedAccounts]);

  // Calculate stats using the custom hook
  const stats = useDashboardStats(filteredTrades);

  // Fetch trades and calculate stats
  useEffect(() => {
    console.log("Dashboard mounted, fetching trades...");
    refetch();
  }, [refetch]);

  useEffect(() => {
    console.log("Trades data from useTrades:", trades);
  }, [trades]);

  const handleCalendarDateClick = (date: Date) => {
    console.log("Calendar date clicked:", date);
    const formattedDate = format(date, "yyyy-MM-dd");
    console.log("Formatted date for navigation:", formattedDate);
    navigate(`/journal?date=${formattedDate}`);
  };

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  const isLoading = tradesLoading || accountsLoading;

  if (isLoading) {
    return (
      <Layout title="Dashboard" showAccountSelector={true}>
        <div className="flex items-center justify-center h-[calc(100vh-96px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Dashboard" 
      showAccountSelector={true}
    >
      <div className="p-4 sm:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Trial Banner - Shows days remaining in trial */}
          <TrialBanner />
          
          {/* Dummy Data Banner - Only show if user has no real trades */}
          {!hasRealTrades && (
            <DummyDataBanner 
              message={banners.dashboard}
              className="mb-4 md:mb-6"
            />
          )}
          
          {/* Stats Cards */}
          <DashboardStats stats={stats} />
          
          {/* Charts */}
          <DashboardCharts 
            filteredTrades={filteredTrades}
            accounts={accounts}
            dateRange={filters.dateRange}
            hasRealTrades={hasRealTrades}
            selectedAccountIds={filters.selectedAccounts.accountIds}
            allAccounts={filters.selectedAccounts.allAccounts}
          />
          
          {/* Bottom Section */}
          <DashboardBottomSection 
            filteredTrades={filteredTrades}
            onCalendarDateClick={handleCalendarDateClick}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
