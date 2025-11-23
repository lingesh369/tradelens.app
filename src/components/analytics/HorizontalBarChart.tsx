
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";
import { cn } from "@/lib/utils";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface HorizontalBarChartProps {
  data: Array<{
    name: string;
    value: number;
    count?: number;
  }>;
  title: string;
  description?: string;
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  showCount?: boolean;
}

const CustomTooltip = ({ active, payload, valuePrefix, valueSuffix, showCount }: 
  TooltipProps<number, string> & { 
    valuePrefix?: string; 
    valueSuffix?: string;
    showCount?: boolean;
  }
) => {
  const { settings } = useGlobalSettings();
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-sm">
        <p className="text-sm font-medium">{data.name}</p>
        <p className={cn(
          "text-sm font-semibold",
          data.value >= 0 ? "text-[#5fc9a5]" : "text-[#ff3d3d]"
        )}>
          {valuePrefix === "$" 
            ? formatCurrencyValue(data.value, settings?.base_currency || "USD") 
            : `${valuePrefix || ""}${data.value >= 0 ? "+" : ""}${Math.abs(data.value).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}${valueSuffix || ""}`
          }
        </p>
        {showCount && data.count !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {data.count} trade{data.count !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function HorizontalBarChart({ 
  data,
  title,
  description,
  className,
  valuePrefix = "$",
  valueSuffix = "",
  showCount = true
}: HorizontalBarChartProps) {
  const { settings } = useGlobalSettings();
  
  // Format the y-axis labels
  const formatYAxis = (value: string): string => {
    // Truncate long labels
    if (value.length > 15) {
      return value.substring(0, 12) + "...";
    }
    return value;
  };

  // Format the x-axis based on whether it's a currency value
  const formatXAxis = (value: number): string => {
    if (valuePrefix === "$") {
      const currency = settings?.base_currency || "USD";
      return formatCurrencyValue(value, currency).replace(/[^\d.-]/g, '');
    }
    return value.toLocaleString();
  };

  return (
    <div className={cn("glass-card rounded-xl p-6 border shadow-sm", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold leading-6">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      
      {data.length > 0 ? (
        <div className="h-64 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={formatXAxis}
              />
              <YAxis 
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={formatYAxis}
                width={70}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    valuePrefix={valuePrefix} 
                    valueSuffix={valueSuffix}
                    showCount={showCount}
                  />
                } 
                cursor={{ opacity: 0.15 }} 
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={valuePrefix === "$" 
                      ? (entry.value >= 0 ? "#5fc9a5" : "#ff3d3d")
                      : "#a78bfa"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full flex items-center justify-start text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
