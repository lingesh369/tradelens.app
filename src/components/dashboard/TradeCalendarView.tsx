
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { startOfMonth, endOfMonth, format, isToday, isSameMonth, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useTrades } from '@/hooks/useTrades';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayContentProps, DayPickerProps, DayPickerSingleProps } from 'react-day-picker';

export const TradeCalendarView: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>();
  const { trades, isLoading, isError, error } = useTrades();
  const [tradesByDate, setTradesByDate] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    if (trades) {
      const groupedTrades: { [key: string]: any[] } = trades.reduce((acc: { [key: string]: any[] }, trade) => {
        const tradeDate = format(new Date(trade.entry_time), 'yyyy-MM-dd');
        if (!acc[tradeDate]) {
          acc[tradeDate] = [];
        }
        acc[tradeDate].push(trade);
        return acc;
      }, {});
      setTradesByDate(groupedTrades);
    }
  }, [trades]);

  const handleMonthChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
  };

  const renderDay = (props: DayContentProps) => {
    // We're only adding a day badge if there are trades for this day
    const day = props.date;
    const tradesForThisDay = tradesByDate[format(day, 'yyyy-MM-dd')] || [];
    const hasWins = tradesForThisDay.some(trade => trade && trade.net_pl > 0);
    const hasLosses = tradesForThisDay.some(trade => trade && trade.net_pl < 0);

    const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
    const isOutsideCurrentMonth = !isSameMonth(day, date);
    
    return (
      <div 
        className={cn(
          "relative flex h-9 w-9 items-center justify-center p-0 font-normal",
          isOutsideCurrentMonth && "text-muted-foreground opacity-30",
          isSelected && "bg-primary text-primary-foreground rounded-md",
          isToday(day) && !isSelected && "border border-primary rounded-md"
        )}
      >
        <time dateTime={format(day, 'yyyy-MM-dd')}>
          {format(day, 'd')}
        </time>
        {tradesForThisDay.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {hasWins && <Badge variant="outline" className="w-1 h-1 p-0 bg-green-500 rounded-full border-0" />}
            {hasLosses && <Badge variant="outline" className="w-1 h-1 p-0 bg-red-500 rounded-full border-0" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-3 relative">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selectedDay}
          onSelect={handleDaySelect}
          defaultMonth={date}
          onMonthChange={handleMonthChange}
          fromMonth={startOfMonth(new Date("2020-01-01"))}
          toMonth={endOfMonth(new Date())}
          components={{
            DayContent: renderDay
          }}
          className="border-none shadow-none"
        />
      </CardContent>
    </Card>
  );
};
