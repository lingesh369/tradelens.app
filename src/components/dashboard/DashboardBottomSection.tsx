
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { FullScreenCalendarView } from "@/components/ui/fullscreen-calendar";
import { Trade } from "@/hooks/useTrades";

interface DashboardBottomSectionProps {
  filteredTrades: Trade[];
  onCalendarDateClick: (date: Date) => void;
}

export function DashboardBottomSection({ filteredTrades, onCalendarDateClick }: DashboardBottomSectionProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in animate-delay-3">
      {/* Recent Trades - Full width on mobile/tablet, 1/4 on desktop */}
      <div className="xl:col-span-1">
        <RecentTrades 
          className="h-[400px] md:h-[500px] xl:h-[550px]" 
          compact 
          trades={filteredTrades} 
        />
      </div>
      
      {/* Calendar - Full width on mobile/tablet, 3/4 on desktop */}
      <div className="xl:col-span-3">
        <FullScreenCalendarView 
          className="h-[400px] md:h-[500px] xl:h-[550px]" 
          trades={filteredTrades} 
          onDateClick={onCalendarDateClick} 
        />
      </div>
    </div>
  );
}
