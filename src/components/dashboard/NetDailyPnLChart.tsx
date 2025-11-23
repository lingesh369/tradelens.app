
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";
import { format, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { cn } from "@/lib/utils";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

// Process trades to create daily P&L data
const processDailyTradeData = (trades: Trade[], dateRange?: DateRange) => {
  if (!trades.length) return [];
  
  console.log("Processing daily trade data with trades:", trades);
  
  // Group trades by date
  const tradesByDate = trades.reduce((acc, trade) => {
    if (!trade.entry_time) return acc;
    if (trade.net_pl === null || trade.net_pl === undefined) return acc;
    
    const dateKey = format(parseISO(trade.entry_time), "yyyy-MM-dd");
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        displayDate: format(parseISO(trade.entry_time), "MMM dd"),
        value: 0,
        count: 0,
      };
    }
    
    acc[dateKey].value += (trade.net_pl || 0);
    acc[dateKey].count += 1;
    
    return acc;
  }, {} as Record<string, { date: string; displayDate: string; value: number; count: number }>);
  
  // Convert to array and sort by date
  const data = Object.values(tradesByDate).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  console.log("Processed daily trade data:", data);
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  const { settings } = useGlobalSettings();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-sm">
        <p className="text-sm font-medium">{data.displayDate}</p>
        <p className={cn(
          "text-sm font-semibold",
          data.value >= 0 ? "text-[#5fc9a5]" : "text-[#ff3d3d]"
        )}>
          {data.value >= 0 ? "+" : ""}
          {formatCurrencyValue(Math.abs(data.value), settings?.base_currency || "USD")}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.count} trade{data.count !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }

  return null;
};

interface NetDailyPnLChartProps {
  className?: string;
  trades?: Trade[];
  dateRange?: DateRange;
  hasRealTrades?: boolean;
}

export function NetDailyPnLChart({ 
  className,
  trades = [],
  dateRange,
  hasRealTrades = false
}: NetDailyPnLChartProps) {
  const [data, setData] = useState<any[]>([]);
  const { settings } = useGlobalSettings();
  
  useEffect(() => {
    // If user has real trades but filter results in no trades, show empty state
    if (hasRealTrades && trades.length === 0) {
      setData([]);
      return;
    }

    if (trades.length > 0) {
      console.log("Processing trades for daily PnL:", trades);
      const chartData = processDailyTradeData(trades, dateRange);
      setData(chartData);
    } else if (!hasRealTrades) {
      // Only show mock data if user has no real trades at all
      const mockData = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dailyValue = (Math.random() * 2000) - 800;
        
        mockData.push({
          date: format(date, "yyyy-MM-dd"),
          displayDate: format(date, "MMM dd"),
          value: dailyValue,
          count: Math.floor(Math.random() * 5) + 1,
        });
      }
      
      setData(mockData);
    } else {
      setData([]);
    }
  }, [trades, dateRange, hasRealTrades]);

  // Format Y-axis values using the user's currency setting
  const formatYAxis = (value: number): string => {
    // Get currency symbol based on user settings
    const currency = settings?.base_currency || "USD";
    const getCurrencySymbol = () => {
      if (currency === "USD") return "$";
      if (currency === "EUR") return "€";
      if (currency === "GBP") return "£";
      if (currency === "JPY") return "¥";
      return "$"; // Default to USD
    };
    
    return `${getCurrencySymbol()}${value.toLocaleString()}`;
  };

  return (
    <div className={cn("glass-card rounded-xl p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-medium">Daily P&L</h3>
          <p className="text-sm text-muted-foreground">Net profit/loss by day</p>
        </div>
      </div>
      
      <div className="h-64 w-full mt-2">
        {data.length === 0 && hasRealTrades ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No data available for the selected filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.15 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value >= 0 ? "#5fc9a5" : "#ff3d3d"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
