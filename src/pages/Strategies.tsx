
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { StrategyCard } from "@/components/strategies/StrategyCard";
import { StrategyDetail } from "@/components/strategies/StrategyDetail";
import { StrategyDialog } from "@/components/strategies/StrategyDialog";
import { useStrategies } from "@/hooks/useStrategies";
import { useStrategyLimits } from "@/hooks/useStrategyLimits";
import { useTrades } from "@/hooks/useTrades";
import { Plus, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Utility functions for URL-friendly strategy names
const createStrategySlug = (strategyName: string): string => {
  return strategyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

const findStrategyBySlug = (strategies: any[], slug: string) => {
  return strategies.find(strategy => 
    createStrategySlug(strategy.strategy_name) === slug
  );
};

const Strategies = () => {
  const { strategyName } = useParams();
  const navigate = useNavigate();
  const [isAddStrategyOpen, setIsAddStrategyOpen] = useState(false);
  
  const { strategies, isLoading, refetch, deleteStrategy } = useStrategies();
  const { trades, isLoading: tradesLoading } = useTrades();
  const { canCreateStrategy, strategiesLimit, currentStrategiesCount } = useStrategyLimits();
  
  const handleViewStrategy = (strategyId: string) => {
    const strategy = strategies.find(s => s.strategy_id === strategyId);
    if (strategy) {
      const slug = createStrategySlug(strategy.strategy_name);
      navigate(`/strategies/${slug}`);
    }
    window.scrollTo(0, 0);
  };
  
  const handleBackToList = () => {
    navigate('/strategies');
    // Refetch strategies when returning to the list to ensure we have updated data
    refetch();
  };
  
  const handleStrategyAdded = () => {
    refetch();
  };
  
  const handleDeleteStrategy = async (strategyId: string) => {
    navigate('/strategies');
    await refetch();
  };
  
  const handleStrategyEdited = async () => {
    // Refetch to update the strategy in the list
    await refetch();
  };

  const handleNewStrategyClick = () => {
    if (!canCreateStrategy) {
      toast.error(`You have reached the maximum number of strategies (${strategiesLimit}) for your current plan. Please upgrade to create more strategies.`);
      return;
    }
    setIsAddStrategyOpen(true);
  };
  
  // Ensure we always have the latest data
  useEffect(() => {
    refetch();
  }, []);
  
  const currentStrategy = strategyName 
    ? findStrategyBySlug(strategies, strategyName)
    : null;

  // Calculate real-time metrics for each strategy
  const getStrategyMetrics = (strategyId: string) => {
    if (tradesLoading) return { winRate: 0, totalTrades: 0, pnl: 0 };

    const strategyTrades = trades.filter(trade => trade.strategy_id === strategyId);
    
    if (strategyTrades.length === 0) {
      return { winRate: 0, totalTrades: 0, pnl: 0 };
    }
    
    const winningTrades = strategyTrades.filter(trade => (trade.net_pl || 0) > 0);
    const totalTrades = strategyTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const pnl = strategyTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    
    return { winRate, totalTrades, pnl };
  };

  const renderStrategies = () => {
    if (isLoading) {
      return Array(6).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="glass-card rounded-xl p-5 h-[250px]">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
            </div>
          </div>
          <div className="mt-6">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ));
    }

    if (strategies.length === 0) {
      return (
        <div className="col-span-full text-center py-10">
          <h3 className="text-xl font-medium text-muted-foreground mb-2">No strategies found</h3>
          <p className="text-muted-foreground mb-6">Create your first strategy to start tracking your performance</p>
          <Button onClick={handleNewStrategyClick} className="gap-2" disabled={!canCreateStrategy}>
            {canCreateStrategy ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {canCreateStrategy ? "New Strategy" : `Limit Reached (${strategiesLimit === -1 ? 'Unlimited' : strategiesLimit})`}
          </Button>
        </div>
      );
    }

    return strategies.map((strategy, index) => {
      const metrics = getStrategyMetrics(strategy.strategy_id);
      
      return (
        <StrategyCard
          key={strategy.strategy_id}
          id={strategy.strategy_id}
          name={strategy.strategy_name}
          description={strategy.description || ""}
          winRate={metrics.winRate}
          totalTrades={metrics.totalTrades}
          pnl={metrics.pnl}
          className={`animate-fade-in-up animate-delay-${index % 4}`}
          onViewDetails={() => handleViewStrategy(strategy.strategy_id)}
        />
      );
    });
  };

  return (
    <Layout title="Strategies">
      <div className="p-6">
        {currentStrategy ? (
          <StrategyDetail 
            id={currentStrategy.strategy_id}
            name={currentStrategy.strategy_name}
            description={currentStrategy.description || undefined}
            winRate={currentStrategy.win_rate || 0}
            totalTrades={currentStrategy.total_trades || 0}
            profitLoss={currentStrategy.net_pl || 0}
            notes={currentStrategy.notes || undefined}
            onBack={handleBackToList}
            onEdit={handleStrategyEdited}
            onDelete={handleDeleteStrategy}
            deleteStrategy={deleteStrategy}
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold">Trading Strategies</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and analyze your trading strategies ({currentStrategiesCount}/{strategiesLimit === -1 ? 'Unlimited' : strategiesLimit} used)
                </p>
              </div>
              
              <Button 
                className="gap-2"
                onClick={handleNewStrategyClick}
                disabled={!canCreateStrategy}
              >
                {canCreateStrategy ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {canCreateStrategy ? "New Strategy" : `Limit Reached`}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animate-delay-1">
              {renderStrategies()}
            </div>
          </>
        )}
      </div>

      {/* Add Strategy Dialog */}
      <StrategyDialog
        open={isAddStrategyOpen}
        onOpenChange={setIsAddStrategyOpen}
        onStrategyAdded={handleStrategyAdded}
      />
    </Layout>
  );
};

export default Strategies;
