
import React, { useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { DummyDataBanner } from "@/components/onboarding/DummyDataBanner";
import { useTrades } from "@/hooks/useTrades";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useAnalyticsAccess } from "@/hooks/useAnalyticsAccess";
import { AnalyticsSidebar } from "@/components/analytics/AnalyticsSidebar";
import { SectionRenderer } from "@/components/analytics/SectionRenderer";
import { useGlobalFilters } from "@/context/FilterContext";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { getDummyDataBanners } from "@/utils/dummyData";

const Analytics = () => {
  const { trades, isLoading, hasRealTrades } = useTrades();
  const { settings } = useGlobalSettings();
  const { canAccessAnalytics, canAccessAllTabs, isLoading: accessLoading } = useAnalyticsAccess();
  const { filters } = useGlobalFilters();
  
  const { 
    activeSection,
    setActiveSection
  } = useAnalyticsData(trades);

  // Get dummy data banners
  const banners = getDummyDataBanners();

  // Filter trades based on global filters using useMemo for immediate reactivity
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Date filter
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
  }, [trades, filters.dateRange.from, filters.dateRange.to, filters.selectedAccounts]);

  console.log("Analytics page - Global filters:", filters);
  console.log("Analytics page - Filtered trades:", filteredTrades);

  if (isLoading || accessLoading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center h-[calc(100vh-96px)]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  // Note: All plans now have access to analytics page
  // Starter plan users can only access overview tab, others can access all tabs

  return (
    <Layout title="Analytics" showAccountSelector={true}>
      <div className="flex flex-col h-full min-w-0">
        <AnalyticsSidebar 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          canAccessAllTabs={canAccessAllTabs}
        />
        
        <div className="flex-1 overflow-auto min-w-0">
          <div className="p-2 sm:p-4 md:p-6 max-w-full">
            {/* Dummy Data Banner - Only show if user has no real trades */}
            {!hasRealTrades && (
              <DummyDataBanner 
                message={banners.analytics}
                className="mb-4 md:mb-6"
              />
            )}

            <div className="w-full overflow-hidden">
              <SectionRenderer 
                activeSection={activeSection}
                isLoading={isLoading}
                trades={filteredTrades}
                filteredTrades={filteredTrades}
                dateRange={filters.dateRange}
                settings={settings}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
