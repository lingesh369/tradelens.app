import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TradeTable } from "@/components/trades/TradeTable";
import { DummyDataBanner } from "@/components/onboarding/DummyDataBanner";
import { TradesHeader } from "@/components/trades/TradesHeader";
import { TradesFilters } from "@/components/trades/TradesFilters";
import { useTrades } from "@/hooks/useTrades";
import { useStrategies } from "@/hooks/useStrategies";
import { useAccounts } from "@/hooks/useAccounts";
import { useTradesColumns } from "@/hooks/useTradesColumns";
import { TradeDialog } from "@/components/trades/TradeDialog";
import { availableColumns } from "@/components/trades/TradesConstants";
import { getDummyDataBanners } from "@/utils/dummyData";
import { Trade } from "@/types/trade";
import { useNavigation } from "@/context/NavigationContext";

// Trades page component
const Trades = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Route-based dialog state management
  const isAddTradeDialogOpen = location.pathname === "/add-trade";

  // Handle dialog close by navigating to /trades
  const handleDialogClose = () => {
    navigate("/trades");
  };

  // Handle Add Trade button click
  const handleAddTradeClick = () => {
    navigate("/add-trade");
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('tradesViewMode', mode);
  };

  // Load saved view mode on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('tradesViewMode') as 'table' | 'grid';
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Custom hooks
  const { selectedColumns, handleColumnChange, needsFixedHeader } = useTradesColumns();

  const {
    trades,
    isLoading,
    formatDateTime,
    formatCurrency,
    refetch,
    VALID_MARKET_TYPES,
    isShowingDummyData
  } = useTrades();

  const { strategies } = useStrategies();
  const { accounts } = useAccounts();

  // Get dummy data banners
  const banners = getDummyDataBanners();

  // Handle filtered trades change
  const handleFilteredTradesChange = useCallback((newFilteredTrades: Trade[]) => {
    setFilteredTrades(newFilteredTrades);
  }, []);

  // Debug log for tracking trades
  useEffect(() => {
    console.log("Current trades in state:", trades);
  }, [trades]);

  // Navigation context
  const { setBreadcrumbs } = useNavigation();

  // Handle trade selection - navigate to trade detail page
  const handleTradeClick = (tradeId: string) => {
    // Set breadcrumb for trades navigation
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Trades', href: '/trades' }
    ], 'trades');
    
    navigate(`/trades/${tradeId}`);
  };

  // Get strategy name from strategy id
  const getStrategyName = (strategyId: string | null): string => {
    if (!strategyId) return "";
    const strategy = strategies.find(s => s.strategy_id === strategyId);
    return strategy ? strategy.strategy_name : "";
  };

  // Get account name from account id
  const getAccountName = (accountId: string | null): string => {
    if (!accountId) return "";
    const account = accounts.find(a => a.account_id === accountId);
    return account ? account.account_name : "";
  };

  // Format trades data for display
  const formattedTrades = filteredTrades.map(trade => {
    // Calculate fees
    const totalFees = (trade.commission || 0) + (trade.fees || 0);

    // Get the raw PL values from the trade
    const netPl = trade.net_pl || 0;
    // Gross P&L should be Net P&L + fees
    const grossPl = netPl + totalFees;
    
    // Calculate exit date from partial exits or exit_time
    let exitDate = undefined;
    if (trade.partial_exits && trade.partial_exits.length > 0) {
      // Use the last partial exit as the exit date
      const lastExit = trade.partial_exits[trade.partial_exits.length - 1];
      exitDate = formatDateTime(lastExit.datetime || '');
    } else if (trade.exit_time) {
      exitDate = formatDateTime(trade.exit_time);
    }
    
    return {
      id: trade.trade_id,
      instrument: trade.instrument,
      entryDate: formatDateTime(trade.entry_time || ''),
      exitDate: exitDate,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price || undefined,
      action: trade.action.toUpperCase(),
      netPnl: netPl,
      grossPnl: grossPl,
      percentGain: trade.percent_gain || 0,
      quantity: trade.quantity,
      status: trade.trade_result || "OPEN",
      strategy: getStrategyName(trade.strategy_id),
      marketType: trade.market_type || "",
      timeframe: trade.trade_time_frame || "",
      totalFees: totalFees,
      r2r: trade.r2r || undefined,
      target: trade.target || undefined,
      stopLoss: trade.sl || undefined,
      account: getAccountName(trade.account_id),
      notes: trade.notes || "",
      tags: trade.tags || [],
      tradeRating: trade.trade_rating || trade.rating || 0,
      additional_images: trade.additional_images || [],
      main_image_url: trade.main_image || null,
      trade_images: [] // This property doesn't exist in Trade type, so we'll use an empty array
    };
  });

  // Trigger refetch on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return (
    <Layout title="Trades" showAccountSelector={true} fixedHeaderOnSmall={true}>
      <div className={`flex flex-col gap-4 sm:gap-6 ${
        needsFixedHeader ? 'p-4 sm:p-6' : 'p-4 sm:p-6'
      }`}>
        {/* Dummy Data Banner */}
        {isShowingDummyData && (
          <DummyDataBanner 
            message={banners.trades}
            className="mb-4"
          />
        )}

        {/* Header - Responsive with proper spacing */}
        <TradesHeader 
          filteredTradesCount={filteredTrades.length}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

        {/* Filtering Logic */}
        <TradesFilters 
          trades={trades} 
          onFilteredTradesChange={handleFilteredTradesChange} 
        />
        
        {/* Trade Table - Fully responsive */}
        <div className="w-full overflow-hidden">
          <TradeTable 
            tradeData={formattedTrades} 
            isLoading={isLoading} 
            availableColumns={availableColumns} 
            selectedColumns={selectedColumns} 
            onColumnsChange={handleColumnChange} 
            onViewTrade={handleTradeClick} 
            strategies={strategies} 
            validMarketTypes={VALID_MARKET_TYPES} 
            className="responsive-trade-table"
            onAddTradeClick={handleAddTradeClick}
            viewMode={viewMode}
          />
        </div>
      </div>
      
      <TradeDialog 
        open={isAddTradeDialogOpen} 
        onOpenChange={handleDialogClose} 
      />
    </Layout>
  );
};

export default Trades;
