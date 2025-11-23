
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Account } from "@/hooks/useAccounts";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeSelector";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

// Process trades to create cumulative balance data
const processTradeData = (trades: Trade[], accounts: Account[], dateRange?: DateRange) => {
  if (!trades.length || !accounts.length) return [];
  
  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = a.entry_time ? new Date(a.entry_time).getTime() : 0;
    const dateB = b.entry_time ? new Date(b.entry_time).getTime() : 0;
    return dateA - dateB;
  });
  
  // Calculate starting balance from accounts
  const startingBalance = accounts.reduce((total, account) => total + account.starting_balance, 0);
  
  // Create data points for each trade
  let cumulativeBalance = startingBalance;
  const data = [];
  
  // Add starting point
  if (sortedTrades.length > 0 && sortedTrades[0].entry_time) {
    data.push({
      date: format(parseISO(sortedTrades[0].entry_time), "MMM dd"),
      fullDate: parseISO(sortedTrades[0].entry_time),
      value: startingBalance,
    });
  }
  
  // Add data points for each trade
  sortedTrades.forEach(trade => {
    if (trade.entry_time && trade.net_pl !== null && trade.net_pl !== undefined) {
      cumulativeBalance += trade.net_pl;
      
      data.push({
        date: format(parseISO(trade.entry_time), "MMM dd"),
        fullDate: parseISO(trade.entry_time),
        value: cumulativeBalance,
      });
    }
  });
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  const { settings } = useGlobalSettings();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm font-semibold text-primary">
          {formatCurrencyValue(Number(payload[0].value), settings?.base_currency || "USD")}
        </p>
      </div>
    );
  }

  return null;
};

interface PerformanceChartProps {
  title: string;
  description?: string;
  className?: string;
  type?: "cumulative" | "daily";
  trades?: Trade[];
  accounts?: Account[];
  dateRange?: DateRange;
  hasRealTrades?: boolean;
}

export function PerformanceChart({ 
  title, 
  description, 
  className, 
  type = "cumulative",
  trades = [],
  accounts = [],
  dateRange,
  hasRealTrades = false
}: PerformanceChartProps) {
  const [data, setData] = useState<any[]>([]);
  const { settings } = useGlobalSettings();
  
  useEffect(() => {
    // If user has real trades but filter results in no trades, show empty state
    if (hasRealTrades && trades.length === 0) {
      setData([]);
      return;
    }

    if (trades.length > 0 && accounts.length > 0) {
      console.log("Processing trades for chart:", trades);
      const chartData = processTradeData(trades, accounts, dateRange);
      setData(chartData);
    } else if (!hasRealTrades) {
      // Only show mock data if user has no real trades at all
      const mockData = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      let cumulativeValue = 10000; // Mock starting balance
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dailyChange = Math.random() * 2000 - 500;
        cumulativeValue += dailyChange;
        
        mockData.push({
          date: format(date, "MMM dd"),
          fullDate: date,
          value: Math.max(0, cumulativeValue),
        });
      }
      
      setData(mockData);
    } else {
      setData([]);
    }
  }, [trades, accounts, dateRange, hasRealTrades]);

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
          <h3 className="text-base font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      
      <div className="h-64 w-full mt-2">
        {data.length === 0 && hasRealTrades ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No data available for the selected filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                minTickGap={15}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1}
                fill="url(#colorValue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
