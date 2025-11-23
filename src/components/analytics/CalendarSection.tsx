
import React, { useState, useMemo } from 'react';
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval, 
  eachDayOfInterval, getMonth, getYear, isSameDay, isWeekend } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CalendarSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function CalendarSection({ trades, dateRange, settings }: CalendarSectionProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  // Get all available years from trades
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    trades.forEach(trade => {
      if (trade.entry_time) {
        const year = getYear(parseISO(trade.entry_time));
        yearsSet.add(year);
      }
    });
    
    // If no trades, add current year
    if (yearsSet.size === 0) {
      yearsSet.add(currentYear);
    }
    
    return Array.from(yearsSet).sort((a, b) => b - a); // Sort descending
  }, [trades, currentYear]);
  
  // Process trade data by date
  const tradesByDate = useMemo(() => {
    const dateMap = new Map<string, number>();
    
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const date = parseISO(trade.entry_time);
      if (getYear(date) !== selectedYear) return;
      
      const dateKey = format(date, 'yyyy-MM-dd');
      const currentValue = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, currentValue + trade.net_pl);
    });
    
    return dateMap;
  }, [trades, selectedYear]);
  
  // Generate calendar data
  const calendarData = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0, 1));
    const end = endOfYear(start);
    
    // Get all months in the year
    const months = eachMonthOfInterval({ start, end });
    
    // For each month, get all days and their trading data
    return months.map(monthDate => {
      const monthStart = new Date(selectedYear, getMonth(monthDate), 1);
      const monthEnd = new Date(selectedYear, getMonth(monthDate) + 1, 0);
      
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      return {
        month: format(monthDate, 'MMMM'),
        days: days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const netPnL = tradesByDate.get(dateKey) || 0;
          
          return {
            date: day,
            dayOfMonth: day.getDate(),
            isWeekend: isWeekend(day),
            netPnL,
            hasTrading: tradesByDate.has(dateKey),
          };
        }),
      };
    });
  }, [selectedYear, tradesByDate]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              Trading performance by day for {selectedYear}
            </CardDescription>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendarData.map((monthData) => (
          <Card key={monthData.month} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{monthData.month}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before first day of month */}
                {Array.from({ length: monthData.days[0].date.getDay() }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-8 rounded-md"></div>
                ))}
                
                {/* Calendar days */}
                {monthData.days.map((day) => (
                  <div
                    key={day.date.toString()}
                    className={cn(
                      "h-8 text-xs flex items-center justify-center rounded-md border",
                      day.isWeekend ? "bg-muted/50" : "",
                      !day.hasTrading && "text-muted-foreground",
                      day.hasTrading && day.netPnL > 0 && "bg-[#5fc9a5]/20 border-[#5fc9a5]",
                      day.hasTrading && day.netPnL < 0 && "bg-[#ff3d3d]/20 border-[#ff3d3d]"
                    )}
                  >
                    {day.dayOfMonth}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
