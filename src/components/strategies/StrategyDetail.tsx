
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { TradeTable } from '../trades/TradeTable';
import { availableColumns } from '@/components/trades/TradesConstants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StrategyDialog } from './StrategyDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyMetricsCard } from './StrategyMetricsCard';
import { StrategyPnLChart } from './StrategyPnLChart';
import { StrategyRulesList } from './StrategyRulesList';
import { StrategyNotes } from './StrategyNotes';
import { StrategyImageUpload } from './StrategyImageUpload';
import { useStrategyRules } from '@/hooks/useStrategyRules';
import { useTrades } from '@/hooks/useTrades';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useNavigation } from '@/context/NavigationContext';
import { useEnhancedNavigation } from '@/hooks/useEnhancedNavigation';

interface StrategyDetailProps {
  id: string;
  name: string;
  description?: string;
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  pnl?: number; 
  notes?: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
  deleteStrategy?: (strategyId: string) => Promise<void>;
}

export function StrategyDetail({
  id,
  name,
  description,
  totalTrades,
  winRate,
  profitLoss,
  pnl,
  notes = "",
  onBack,
  onEdit,
  onDelete,
  deleteStrategy,
}: StrategyDetailProps) {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useNavigation();
  const { navigateToTrade } = useEnhancedNavigation();
  // Use either profitLoss or pnl, with profitLoss taking precedence
  const actualProfitLoss = profitLoss !== undefined ? profitLoss : (pnl || 0);
  
  // Media queries for responsive behavior
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");

  // Get default columns based on screen size
  const getDefaultColumns = () => {
    if (isMobile) {
      // Mobile: Only priority 1 columns (4 columns) - default ones
      return ["instrument", "entryDate", "action", "netPnl"];
    } else if (isTablet) {
      // Tablet: 6 columns - add Entry Price and Status
      return ["instrument", "entryDate", "action", "netPnl", "entryPrice", "status"];
    } else if (isDesktop) {
      // Desktop: 8-10 columns
      return availableColumns.filter(col => col.priority <= 3).map(col => col.id);
    } else {
      // Large Desktop: All default columns
      return availableColumns.filter(col => col.default).map(col => col.id);
    }
  };

  // Add column selection state with responsive defaults
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const savedColumns = localStorage.getItem('strategyTradeColumns');
    if (savedColumns) {
      const parsed = JSON.parse(savedColumns);
      // Filter based on current screen size
      return parsed.filter((col: string) => getDefaultColumns().includes(col));
    }
    return getDefaultColumns();
  });
  
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Add state for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Add state for active tab
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch trades for this strategy
  const { trades, isLoading: isLoadingTrades } = useTrades();
  
  // Fetch strategy rules
  const { rules, isLoading: isLoadingRules, refetch: refetchRules } = useStrategyRules(id);
  
  // Strategy metrics
  const [metrics, setMetrics] = useState({
    avgWinner: 0,
    avgLoser: 0,
    largestProfit: 0,
    largestLoss: 0,
    profitFactor: 0,
    totalR2R: 0,
    netPnL: 0,
    winRate: 0,
    totalTrades: 0
  });

  // Update selected columns when screen size changes
  useEffect(() => {
    const newDefaultColumns = getDefaultColumns();
    setSelectedColumns(prev => {
      // Keep user's selections but ensure priority columns are included for current screen size
      const filtered = prev.filter(col => 
        availableColumns.find(availCol => 
          availCol.id === col && 
          (isMobile ? 
            ["instrument", "entryDate", "action", "netPnl"].includes(col) : 
            isTablet ? 
              ["instrument", "entryDate", "action", "netPnl", "entryPrice", "status"].includes(col) :
              isDesktop ? availCol.priority <= 3 : true
          )
        )
      );

      // Add missing priority columns for current screen size
      const missing = newDefaultColumns.filter(col => !filtered.includes(col));
      return [...filtered, ...missing];
    });
  }, [isMobile, isTablet, isDesktop, isLargeDesktop]);
  
  // Calculate actual metrics from trade data
  useEffect(() => {
    if (!isLoadingTrades) {
      const strategyTrades = trades.filter(trade => trade.strategy_id === id);
      
      if (strategyTrades.length === 0) {
        setMetrics({
          avgWinner: 0,
          avgLoser: 0,
          largestProfit: 0,
          largestLoss: 0,
          profitFactor: 0,
          totalR2R: 0,
          netPnL: 0,
          winRate: 0,
          totalTrades: 0
        });
        return;
      }
      
      const winningTrades = strategyTrades.filter(trade => (trade.net_pl || 0) > 0);
      const losingTrades = strategyTrades.filter(trade => (trade.net_pl || 0) < 0);
      
      const totalWinnings = winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
      const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0));
      
      const netPnL = strategyTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
      const totalTradesCount = strategyTrades.length;
      const winRateValue = totalTradesCount > 0 ? (winningTrades.length / totalTradesCount) * 100 : 0;
      
      const avgWinner = winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0;
      const avgLoser = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
      
      const largestProfit = winningTrades.length > 0 
        ? Math.max(...winningTrades.map(trade => trade.net_pl || 0)) 
        : 0;
        
      const largestLoss = losingTrades.length > 0 
        ? Math.min(...losingTrades.map(trade => trade.net_pl || 0)) 
        : 0;
        
      const profitFactor = totalLosses !== 0 ? totalWinnings / totalLosses : totalWinnings > 0 ? Infinity : 0;
      
      const totalR2R = strategyTrades.reduce((sum, trade) => sum + (trade.r2r || 0), 0);
      
      setMetrics({
        avgWinner,
        avgLoser: Math.abs(avgLoser),
        largestProfit,
        largestLoss,
        profitFactor,
        totalR2R,
        netPnL,
        winRate: winRateValue,
        totalTrades: totalTradesCount
      });
    }
  }, [isLoadingTrades, trades, id]);

  // Handle column change
  const handleColumnChange = (columns: string[]) => {
    setSelectedColumns(columns);
    localStorage.setItem('strategyTradeColumns', JSON.stringify(columns));
  };

  // Create strategy slug from name
  const createStrategySlug = (strategyName: string) => {
    return strategyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Handle trade click - navigate to trade detail page
  const handleTradeClick = (tradeId: string) => {
    // Use enhanced navigation with strategy context using strategy name slug
    const strategySlug = createStrategySlug(name);
    navigateToTrade(tradeId, 'strategy', strategySlug, { strategyName: name });
  };

  // Handle delete strategy - use the deleteStrategy function from useStrategies hook
  const handleDeleteStrategy = async () => {
    try {
      if (deleteStrategy) {
        await deleteStrategy(id);
      }
      if (onDelete) {
        onDelete(id);
      }
    } catch (err) {
      console.error("Error in delete strategy handler:", err);
    }
  };

  // Handle strategy update
  const handleStrategyUpdated = () => {
    if (onEdit) onEdit();
  };

  // Load saved columns on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('strategyTradeColumns');
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        // Filter saved columns based on current screen size
        const filteredColumns = parsedColumns.filter((col: string) => getDefaultColumns().includes(col));
        // Add missing default columns for current screen size
        const defaultCols = getDefaultColumns();
        const missingCols = defaultCols.filter(col => !filteredColumns.includes(col));
        setSelectedColumns([...filteredColumns, ...missingCols]);
      } catch (e) {
        console.error('Error parsing saved columns for strategy', e);
        setSelectedColumns(getDefaultColumns());
      }
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          className="flex items-center gap-1 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Strategies
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{name}</h1>
        {description && (
          <p className="text-muted-foreground mb-2">{description}</p>
        )}
      </div>
      
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <StrategyMetricsCard
            netPL={metrics.netPnL}
            totalTrades={metrics.totalTrades}
            winRate={metrics.winRate}
            profitFactor={metrics.profitFactor}
            avgWinner={metrics.avgWinner}
            avgLoser={metrics.avgLoser}
            largestProfit={metrics.largestProfit}
            largestLoss={metrics.largestLoss}
            totalR2R={metrics.totalR2R}
            isLoading={isLoadingTrades}
          />
          
          <StrategyPnLChart 
            trades={trades} 
            strategyId={id} 
            isLoading={isLoadingTrades}
          />
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-6">
          <StrategyRulesList 
            strategyId={id}
            rules={rules}
            isLoading={isLoadingRules}
            onRulesChange={refetchRules}
          />
          
          <StrategyImageUpload 
            strategyId={id} 
            isLoading={isLoadingRules}
          />
        </TabsContent>
        
        <TabsContent value="trades">
          <TradeTable 
            filterByStrategy={id} 
            availableColumns={availableColumns}
            selectedColumns={selectedColumns}
            onColumnsChange={handleColumnChange}
            onViewTrade={handleTradeClick}
            className="responsive-trade-table"
          />
        </TabsContent>
        
        <TabsContent value="notes">
          <StrategyNotes 
            strategyId={id}
            notes={notes || ""}
            isLoading={false}
            onNotesChange={handleStrategyUpdated}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{name}" strategy and cannot be undone.
              Trades associated with this strategy will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStrategy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Strategy Dialog */}
      <StrategyDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onStrategyAdded={handleStrategyUpdated}
        editStrategy={{
          id: id,
          name: name,
          description: description || "",
        }}
      />
    </div>
  );
}
