
"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
  formatISO
} from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Trade } from "@/hooks/useTrades"
import { useJournal } from "@/hooks/useJournal"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalSettings } from "@/hooks/useGlobalSettings"
import { formatCurrencyValue } from "@/lib/currency-data"

export interface CalendarDayData {
  date: Date;
  pnl: number;
  trades: number;
  hasJournal: boolean;
}

interface TradeCalendarViewProps {
  trades?: Trade[];
  onDateClick?: (date: Date) => void;
  className?: string;
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

// Process trades to get daily summary
const processTradesToDailySummary = (trades: Trade[]) => {
  const dailySummary: { [key: string]: CalendarDayData } = {};
  
  trades.forEach(trade => {
    if (trade.entry_time && trade.net_pl !== null) {
      const dateStr = trade.entry_time.split('T')[0]; // Get YYYY-MM-DD
      const date = new Date(dateStr);
      
      if (!dailySummary[dateStr]) {
        dailySummary[dateStr] = { 
          date, 
          pnl: 0, 
          trades: 0,
          hasJournal: false 
        };
      }
      
      dailySummary[dateStr].pnl += trade.net_pl;
      dailySummary[dateStr].trades += 1;
    }
  });
  
  return dailySummary;
};

export function FullScreenCalendarView({ 
  trades = [], 
  onDateClick,
  className 
}: TradeCalendarViewProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTabletOrMobile = useMediaQuery("(max-width: 1023px)")
  const navigate = useNavigate()
  const { journals, getJournalByDate } = useJournal()
  const { settings } = useGlobalSettings()
  
  // Journal dialog state
  const [journalOpen, setJournalOpen] = React.useState(false)
  const [currentJournal, setCurrentJournal] = React.useState<any>(null)
  const [journalNotes, setJournalNotes] = React.useState("")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 0 }),
  })

  // Process trades for calendar display
  const [dailySummary, setDailySummary] = React.useState<{[key: string]: CalendarDayData}>({});
  
  React.useEffect(() => {
    if (trades.length > 0) {
      const summary = processTradesToDailySummary(trades);
      
      // Add journal information
      journals.forEach(journal => {
        if (journal.journal_date) {
          const dateStr = journal.journal_date.split('T')[0];
          if (summary[dateStr]) {
            summary[dateStr].hasJournal = true;
          } else {
            const date = new Date(dateStr);
            summary[dateStr] = {
              date,
              pnl: 0,
              trades: 0,
              hasJournal: true
            };
          }
        }
      });
      
      setDailySummary(summary);
    }
  }, [trades, journals]);

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
  }

  // Load journal entry when a date is selected
  const loadJournalEntry = React.useCallback(async (date: Date) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const journal = await getJournalByDate(formattedDate);
      
      setCurrentJournal(journal);
      setJournalNotes(journal?.notes || "");
      setJournalOpen(true);
    } catch (error) {
      console.error("Error loading journal:", error);
    }
  }, [getJournalByDate]);

  const handleDateClick = (day: Date) => {
    setSelectedDay(day);
    loadJournalEntry(day);
    if (onDateClick) {
      onDateClick(day);
    }
  };

  // Calculate week summaries
  const getWeekPnL = (weekStartDay: number): { pnl: number, count: number } => {
    let totalPnl = 0;
    let totalTrades = 0;
    
    for (let i = 0; i < 7; i++) {
      const day = days[weekStartDay + i];
      if (!day) break;
      
      const dateStr = formatISO(day, { representation: 'date' });
      const dayData = dailySummary[dateStr];
      
      if (dayData) {
        totalPnl += dayData.pnl;
        totalTrades += dayData.trades;
      }
    }
    
    return { pnl: totalPnl, count: totalTrades };
  };

  return (
    <div className={cn("glass-card rounded-xl overflow-hidden h-full bg-background/90 border", className)}>
      <div className="flex items-center justify-between p-3 md:p-4 border-b">
        <h3 className="text-sm md:text-base font-medium">Calendar View</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs md:text-sm">
            Today
          </Button>
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <span className="text-xs md:text-sm font-medium min-w-20 md:min-w-24 text-center">
              {format(firstDayCurrentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-3rem)] md:h-[calc(100%-4rem)]">
        {/* Calendar grid */}
        <div className="flex-1 overflow-auto">
          {/* Week days header */}
          <div className="grid grid-cols-7 text-center border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-xs font-medium text-muted-foreground p-1 md:p-2 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, dayIdx) => {
              const formattedDate = formatISO(day, { representation: 'date' });
              const dayData = dailySummary[formattedDate];
              const thisMonth = isSameMonth(day, firstDayCurrentMonth);
              
              return (
                <div
                  key={dayIdx}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "min-h-16 md:min-h-20 lg:min-h-24 border-r border-b p-0.5 md:p-1 last:border-r-0 relative cursor-pointer",
                    !thisMonth && "opacity-50 bg-muted/10",
                    isToday(day) && "bg-muted/30",
                    isEqual(day, selectedDay) && "ring-2 ring-primary/30 ring-inset",
                    dayData && dayData.pnl > 0 ? "bg-[#5fc9a5]/20" : "",
                    dayData && dayData.pnl < 0 ? "bg-[#ff3d3d]/20" : "",
                  )}
                >
                  <div className={cn(
                    "flex justify-between items-start p-0.5 md:p-1",
                    dayData?.hasJournal && "ring-1 ring-primary/20"
                  )}>
                    <span className={cn(
                      "text-xs md:text-sm",
                      isToday(day) && "font-medium",
                    )}>
                      {format(day, "d")}
                    </span>
                    
                    {dayData?.hasJournal && (
                      <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                  
                  {dayData && (
                    <div className="flex flex-col mt-0.5 md:mt-1 p-0.5 md:p-1">
                      <span className={cn(
                        "text-xs md:text-sm font-mono tabular-nums font-semibold leading-tight",
                        dayData.pnl > 0 ? "text-[#5fc9a5]" : "text-[#ff3d3d]"
                      )}>
                        {formatCurrencyValue(Math.abs(dayData.pnl), settings?.base_currency || "USD")}
                      </span>
                      {dayData.trades > 0 && (
                        <span className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                          {dayData.trades} trade{dayData.trades !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* P&L per week sidebar - Hidden on tablet and mobile */}
        {!isTabletOrMobile && (
          <div className="w-28 lg:w-32 border-l px-2 py-4 flex flex-col overflow-y-auto">
            <h4 className="text-sm font-medium px-2 mb-3">P&L Per Week</h4>
            <div className="space-y-5">
              {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => {
                const weekStartIdx = weekIndex * 7;
                const summary = getWeekPnL(weekStartIdx);
                
                // Only display weeks with trading activity
                if (summary.count === 0) return null;
                
                const weekNumber = weekIndex + 1;
                
                return (
                  <div key={weekIndex} className="px-2">
                    <div className={cn(
                      "text-sm lg:text-base font-mono tabular-nums font-medium",
                      summary.pnl > 0 ? "text-[#5fc9a5]" : "text-[#ff3d3d]"
                    )}>
                      {formatCurrencyValue(Math.abs(summary.pnl), settings?.base_currency || "USD")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Week {weekNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Journal Entry Dialog */}
      <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDay && (
                <span>Journal Entry - {format(selectedDay, "MMMM d, yyyy")}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4 py-2">
              {/* Trade summary for the selected date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const formattedDate = format(selectedDay, "yyyy-MM-dd");
                  const dayData = dailySummary[formattedDate] || { pnl: 0, trades: 0 };
                  
                  return (
                    <>
                      <div className="rounded-md border p-3">
                        <div className="text-sm text-muted-foreground">Net P&L</div>
                        <div className={cn(
                          "text-xl font-bold",
                          dayData.pnl > 0 ? "text-[#5fc9a5]" : dayData.pnl < 0 ? "text-[#ff3d3d]" : ""
                        )}>
                          {formatCurrencyValue(Math.abs(dayData.pnl), settings?.base_currency || "USD")}
                        </div>
                      </div>
                      
                      <div className="rounded-md border p-3">
                        <div className="text-sm text-muted-foreground">Trades</div>
                        <div className="text-xl font-bold">{dayData.trades}</div>
                      </div>
                      
                      <div className="rounded-md border p-3">
                        <div className="text-sm text-muted-foreground">Day Result</div>
                        <div className={cn(
                          "text-xl font-bold",
                          dayData.pnl > 0 ? "text-[#5fc9a5]" : dayData.pnl < 0 ? "text-[#ff3d3d]" : "text-muted-foreground"
                        )}>
                          {dayData.pnl > 0 ? "Profit" : dayData.pnl < 0 ? "Loss" : "Neutral"}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Journal notes */}
              <div>
                <h4 className="text-sm font-medium mb-2">Journal Notes</h4>
                <div className="rounded-md border p-4 min-h-[200px] whitespace-pre-line">
                  {journalNotes ? (
                    journalNotes
                  ) : (
                    <span className="text-muted-foreground">
                      No journal notes for this day.
                    </span>
                  )}
                </div>
              </div>
              
              {/* Footer actions */}
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/journal?date=${format(selectedDay, "yyyy-MM-dd")}`)}
                >
                  View Full Journal
                </Button>
                <Button onClick={() => setJournalOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
