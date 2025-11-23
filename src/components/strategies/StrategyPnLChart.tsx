
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Trade } from "@/types/trade";
import { format, parseISO } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface StrategyPnLChartProps {
  trades: Trade[];
  strategyId: string;
  isLoading?: boolean;
}

export function StrategyPnLChart({
  trades,
  strategyId,
  isLoading = false
}: StrategyPnLChartProps) {
  const { settings } = useGlobalSettings();
  
  // Format currency based on user settings
  const formatCurrency = (value: number) => {
    return formatCurrencyValue(value, settings?.base_currency || "USD");
  };
  
  const chartData = useMemo(() => {
    if (!trades?.length) return [];

    // Filter trades for this strategy and sort by date
    const strategyTrades = trades.filter(trade => trade.strategy_id === strategyId && trade.exit_time && trade.net_pl !== null).sort((a, b) => {
      const dateA = a.exit_time ? new Date(a.exit_time).getTime() : 0;
      const dateB = b.exit_time ? new Date(b.exit_time).getTime() : 0;
      return dateA - dateB;
    });
    if (strategyTrades.length === 0) return [];

    // Calculate cumulative P&L
    let cumulativePnL = 0;
    return strategyTrades.map(trade => {
      cumulativePnL += trade.net_pl || 0;
      return {
        date: format(parseISO(trade.exit_time!), 'yyyy-MM-dd'),
        pnl: cumulativePnL,
        dailyPnL: trade.net_pl || 0
      };
    });
  }, [trades, strategyId]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Define chart colors for profit/loss
  const chartConfig = {
    profit: {
      label: "Profit",
      theme: {
        light: "hsl(var(--profit))",
        dark: "hsl(var(--profit))"
      }
    },
    loss: {
      label: "Loss",
      theme: {
        light: "hsl(var(--loss))",
        dark: "hsl(var(--loss))"
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cumulative P&L Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-4 w-full">
        <div className="w-full h-[300px] min-h-[300px] max-w-full">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart 
                  data={chartData} 
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 30
                  }}
                  style={{ maxWidth: '100%' }}
                >
                  <defs>
                    <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--profit))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--loss))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--loss))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={{ stroke: 'hsl(var(--border))' }} 
                    tickLine={false} 
                    minTickGap={30} 
                    tick={{ fontSize: 12 }} 
                    height={30} 
                  />
                  <YAxis 
                    tickFormatter={value => formatCurrency(value)} 
                    axisLine={{ stroke: 'hsl(var(--border))' }} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                    width={60} 
                    domain={['auto', 'auto']} 
                  />
                  <Tooltip content={(props: any) => {
                    if (!props.active || !props.payload?.length) return null;
                    const data = props.payload[0].payload;
                    const pnl = data.pnl;
                    const dailyPnL = data.dailyPnL;
                    const date = data.date;
                    return (
                      <div className="p-3 bg-background border rounded-md shadow-md">
                        <p className="text-sm font-medium">{date}</p>
                        <p className={`text-sm font-medium ${pnl >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}`}>
                          Cumulative: {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </p>
                        <p className={`text-xs ${dailyPnL >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}`}>
                          Daily: {dailyPnL >= 0 ? '+' : ''}{formatCurrency(dailyPnL)}
                        </p>
                      </div>
                    );
                  }} />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#gradientProfit)" 
                    fillOpacity={0.6} 
                    strokeWidth={2} 
                    dot={{ r: 2 }} 
                    activeDot={{ r: 5 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-start">
              <p className="text-muted-foreground">No performance data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
