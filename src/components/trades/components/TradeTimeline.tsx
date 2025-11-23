
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PartialExit {
  action: string;
  datetime: string;
  quantity: number;
  price: number;
  fee: number;
}

interface TimelineEvent {
  type: 'entry' | 'exit' | 'target' | 'stop_loss';
  datetime?: string;
  action?: string;
  quantity?: number;
  price: number;
  fee?: number;
  label: string;
  icon: string;
}

interface TradeTimelineProps {
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number | null;
  action: string;
  quantity: number;
  target?: number | null;
  stopLoss?: number | null;
  partialExits?: PartialExit[];
}

export function TradeTimeline({
  entryDate,
  exitDate,
  entryPrice,
  exitPrice,
  action,
  quantity,
  target,
  stopLoss,
  partialExits = []
}: TradeTimelineProps) {
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    
    // Unicode subscript characters for partial exits
    const subscriptNumbers = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    
    // Add stop loss first (if exists) - positioned before entry based on price
    if (stopLoss) {
      events.push({
        type: 'stop_loss',
        price: stopLoss,
        label: 'SL',
        icon: 'SL'
      });
    }
    
    // Add entry event
    events.push({
      type: 'entry',
      datetime: entryDate,
      action: action.toUpperCase(),
      quantity,
      price: entryPrice,
      label: action === 'buy' ? 'B' : 'S',
      icon: action === 'buy' ? 'B' : 'S'
    });

    // Add partial exits with subscript numbers
    partialExits.forEach((exit, index) => {
      const subscript = subscriptNumbers[index] || `₍${index + 1}₎`;
      const exitLabel = exit.action === 'buy' ? 'B' : 'S';
      
      events.push({
        type: 'exit',
        datetime: exit.datetime,
        action: exit.action.toUpperCase(),
        quantity: exit.quantity,
        price: exit.price,
        fee: exit.fee,
        label: `${exitLabel}${subscript}`,
        icon: `${exitLabel}${subscript}`
      });
    });

    // Add final exit if exists and no partial exits cover full quantity
    if (exitPrice && partialExits.length === 0) {
      events.push({
        type: 'exit',
        datetime: exitDate || entryDate, // Use exitDate if available, otherwise fall back to entryDate
        action: action === 'buy' ? 'SELL' : 'BUY',
        quantity,
        price: exitPrice,
        label: action === 'buy' ? 'S' : 'B',
        icon: action === 'buy' ? 'S' : 'B'
      });
    }

    // Add target last (if exists) - positioned after entry based on price
    if (target) {
      events.push({
        type: 'target',
        price: target,
        label: 'TP',
        icon: 'TP'
      });
    }

    // Sort by price in ascending order for proper positioning
    return events.sort((a, b) => {
      // For buy positions: SL < Entry < Exits < TP
      // For sell positions: TP < Entry < Exits < SL
      const isLong = action === 'buy';
      
      if (isLong) {
        return a.price - b.price; // Ascending order for long positions
      } else {
        return b.price - a.price; // Descending order for short positions
      }
    });
  }, [entryDate, exitDate, entryPrice, exitPrice, action, quantity, target, stopLoss, partialExits]);

  const formatPrice = (price: number) => {
    // Show decimals only if they exist
    return price % 1 === 0 ? price.toString() : price.toString();
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'entry':
        return 'text-white shadow-md border-0';
      case 'exit':
        return 'text-white shadow-md border-0';
      case 'target':
        return 'text-white shadow-md border-0';
      case 'stop_loss':
        return 'text-white shadow-md border-0';
      default:
        return 'bg-gray-500 text-white shadow-md border-0';
    }
  };

  const getEventBackgroundColor = (type: string) => {
    switch (type) {
      case 'entry':
        return '#8b5cf6';
      case 'exit':
        return '#ef4444';
      case 'target':
        return '#22c55e';
      case 'stop_loss':
        return '#fcb441';
      default:
        return undefined;
    }
  };

  if (timelineEvents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop & Tablet Horizontal Timeline */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-border"></div>
            
            {/* Timeline Events */}
            <div className="flex justify-between items-start relative">
              {timelineEvents.map((event, index) => {
                const showDateTime = event.datetime && (event.type === 'entry' || event.type === 'exit');
                const { date, time } = showDateTime ? formatDateTime(event.datetime!) : { date: '', time: '' };
                const bgColor = getEventBackgroundColor(event.type);
                
                return (
                  <div key={index} className="flex flex-col items-center relative">
                    {/* Event Marker */}
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getEventColor(event.type)} z-10`}
                      style={bgColor ? { backgroundColor: bgColor } : {}}
                    >
                      {event.icon}
                    </div>
                    
                    {/* Event Details */}
                    <div className="mt-3 text-center min-w-[80px]">
                      {showDateTime && (
                        <>
                          <div className="text-xs text-muted-foreground">
                            {date}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {time}
                          </div>
                        </>
                      )}
                      <div className="text-sm font-medium">
                        {event.quantity && (
                          <span>{event.quantity} @ </span>
                        )}
                        <span>{formatPrice(event.price)}</span>
                      </div>
                      {event.fee && event.fee > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Fee: {formatPrice(event.fee)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Vertical Timeline */}
        <div className="md:hidden">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* Timeline Events */}
            <div className="space-y-4">
              {timelineEvents.map((event, index) => {
                const showDateTime = event.datetime && (event.type === 'entry' || event.type === 'exit');
                const { date, time } = showDateTime ? formatDateTime(event.datetime!) : { date: '', time: '' };
                const bgColor = getEventBackgroundColor(event.type);
                
                return (
                  <div key={index} className="flex items-start relative">
                    {/* Event Marker */}
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getEventColor(event.type)} z-10 flex-shrink-0`}
                      style={bgColor ? { backgroundColor: bgColor } : {}}
                    >
                      {event.icon}
                    </div>
                    
                    {/* Event Details */}
                    <div className="ml-3 flex-1">
                      {showDateTime && (
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {date}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {time}
                          </Badge>
                        </div>
                      )}
                      <div className="text-sm font-medium">
                        {event.quantity && (
                          <span>{event.quantity} @ </span>
                        )}
                        <span>{formatPrice(event.price)}</span>
                      </div>
                      {event.fee && event.fee > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Fee: {formatPrice(event.fee)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
