
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TradeDateTimeInputsProps {
  entryDate: string;
  entryTime: string;
  exitDate: string | null;
  exitTime: string | null;
  isReadOnly?: boolean;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
  onExitDateChange: (value: string | null) => void;
  onExitTimeChange: (value: string | null) => void;
}

export function TradeDateTimeInputs({
  entryDate,
  entryTime,
  exitDate,
  exitTime,
  isReadOnly = false,
  onEntryDateChange,
  onEntryTimeChange,
  onExitDateChange,
  onExitTimeChange
}: TradeDateTimeInputsProps) {
  const [entryDateOpen, setEntryDateOpen] = useState(false);
  const [exitDateOpen, setExitDateOpen] = useState(false);

  const handleEntryDateSelect = (date: Date | undefined) => {
    if (date) {
      onEntryDateChange(format(date, "yyyy-MM-dd"));
      setEntryDateOpen(false);
    }
  };

  const handleExitDateSelect = (date: Date | undefined) => {
    if (date) {
      onExitDateChange(format(date, "yyyy-MM-dd"));
      setExitDateOpen(false);
    }
  };

  const clearExitDate = () => {
    onExitDateChange(null);
    onExitTimeChange(null);
  };

  // Format time to HH:MM (remove seconds if present)
  const formatTimeValue = (timeValue: string | null) => {
    if (!timeValue) return "";
    // If time includes seconds, remove them
    const timeParts = timeValue.split(":");
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    return timeValue;
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Date & Time</h4>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Entry Date and Time Row */}
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3">
            <Label>Entry Date</Label>
            {isReadOnly ? (
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {entryDate ? format(new Date(entryDate), "MMM dd, yyyy") : "No date"}
              </div>
            ) : (
              <Popover open={entryDateOpen} onOpenChange={setEntryDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entryDate ? format(new Date(entryDate), "MMM dd, yyyy") : "Pick entry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entryDate ? new Date(entryDate) : undefined}
                    onSelect={handleEntryDateSelect}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="entryTime">Entry Time</Label>
            {isReadOnly ? (
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {formatTimeValue(entryTime) || "No time"}
              </div>
            ) : (
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="entryTime"
                  type="time"
                  value={formatTimeValue(entryTime)}
                  onChange={(e) => onEntryTimeChange(e.target.value)}
                  className="pl-10"
                  step="60"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Exit Date and Time Row */}
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3">
            <Label>Exit Date</Label>
            {isReadOnly ? (
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {exitDate ? format(new Date(exitDate), "MMM dd, yyyy") : "No exit date"}
              </div>
            ) : (
              <div className="flex gap-1">
                <Popover open={exitDateOpen} onOpenChange={setExitDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !exitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exitDate ? format(new Date(exitDate), "MMM dd, yyyy") : "Pick exit date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exitDate ? new Date(exitDate) : undefined}
                      onSelect={handleExitDateSelect}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {exitDate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearExitDate}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="exitTime">Exit Time</Label>
            {isReadOnly ? (
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {formatTimeValue(exitTime) || "No time"}
              </div>
            ) : (
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="exitTime"
                  type="time"
                  value={formatTimeValue(exitTime)}
                  onChange={(e) => onExitTimeChange(e.target.value || null)}
                  disabled={!exitDate}
                  className="pl-10"
                  step="60"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
