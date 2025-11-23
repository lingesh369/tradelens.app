
import React from 'react';
import { DateRange } from "@/components/filters/DateRangeTypes";
import { Trade } from "@/hooks/useTrades";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewSection } from "@/components/analytics/OverviewSection";
import { DaysSection } from "@/components/analytics/DaysSection";
import { TradeTimeSection } from "@/components/analytics/TradeTimeSection";
import { TradeDurationSection } from "@/components/analytics/TradeDurationSection";
import { InstrumentSection } from "@/components/analytics/InstrumentSection";
import { MarketsSection } from "@/components/analytics/MarketsSection";
import { StrategiesSection } from "@/components/analytics/StrategiesSection";
import { CalendarSection } from "@/components/analytics/CalendarSection";
import { WeeksSection } from "@/components/analytics/WeeksSection";
import { MonthsSection } from "@/components/analytics/MonthsSection";
import { MistakeTagsSection } from "@/components/analytics/MistakeTagsSection";
import { OtherTagsSection } from "@/components/analytics/OtherTagsSection";
import { R2RSection } from "@/components/analytics/R2RSection";
import { PositionSizeSection } from "@/components/analytics/PositionSizeSection";

interface SectionRendererProps {
  activeSection: string;
  isLoading: boolean;
  trades: Trade[];
  filteredTrades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  activeSection,
  isLoading,
  filteredTrades,
  dateRange,
  settings
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  switch (activeSection) {
    case "overview":
      return (
        <OverviewSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "days":
      return (
        <DaysSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "weeks":
      return (
        <WeeksSection
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "months":
      return (
        <MonthsSection
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "tradetime":
      return (
        <TradeTimeSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "duration":
      return (
        <TradeDurationSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "instruments":
      return (
        <InstrumentSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "markets":
      return (
        <MarketsSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "strategies":
      return (
        <StrategiesSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "rmultiple":
      return (
        <R2RSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "positionsize":
      return (
        <PositionSizeSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "mistaketags":
      return (
        <MistakeTagsSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "othertags":
      return (
        <OtherTagsSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    case "calendar":
      return (
        <CalendarSection 
          trades={filteredTrades} 
          dateRange={dateRange}
          settings={settings}
        />
      );
    default:
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">This section is under development</p>
        </div>
      );
  }
};
