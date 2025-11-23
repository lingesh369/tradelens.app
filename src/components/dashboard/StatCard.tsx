
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string | number;
  className?: string;
  valueClassName?: string;
  tooltip?: string;
  isCurrency?: boolean;
  rawValue?: number;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
  valueClassName,
  tooltip,
  isCurrency = false,
  rawValue,
}: StatCardProps) {
  const { settings } = useGlobalSettings();
  
  // Format the displayed value if it's currency
  const displayValue = () => {
    if (isCurrency && typeof rawValue === 'number') {
      return formatCurrencyValue(Math.abs(rawValue), settings?.base_currency || "USD");
    }
    return value;
  };

  return (
    <div className={cn("glass-card rounded-xl p-3 card-shine", className)}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1">
          <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      
      <div className="mt-1">
        <div className={cn("text-lg md:text-xl font-bold", valueClassName)}>
          {displayValue()}
        </div>
        
        {(description || trend) && (
          <div className="flex items-center mt-1 gap-1">
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-[hsl(var(--profit))]",
                  trend === "down" && "text-[hsl(var(--loss))]"
                )}
              >
                {trend === "up" && "↑ "}
                {trend === "down" && "↓ "}
                {trendValue}
              </span>
            )}
            
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
