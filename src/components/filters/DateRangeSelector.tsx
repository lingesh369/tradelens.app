
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange, DateRangeSelectorProps, DatePreset } from "./DateRangeTypes";
import { getPresetDateRange, formatDateRangeDisplay, DATE_PRESETS } from "./DateRangeUtils";

export { type DateRange, type DatePreset };

interface ExtendedDateRangeSelectorProps extends DateRangeSelectorProps {
  value?: DateRange;
}

export function DateRangeSelector({ onChange, className, value }: ExtendedDateRangeSelectorProps) {
  // Initialize with provided value or default to "allTime"
  const initialDateRange: DateRange = value || getPresetDateRange("allTime");

  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [isOpen, setIsOpen] = useState(false);



  // Update local state when value prop changes
  useEffect(() => {
    if (value) {

      setDateRange(value);
    }
  }, [value]);

  // Apply preset date range
  const applyPreset = (preset: string) => {

    const newDateRange = getPresetDateRange(preset as DatePreset);
    setDateRange(newDateRange);



    onChange(newDateRange);
  };

  // Handle custom date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!dateRange.from || dateRange.to) {
      // If no from date or both dates are set, start new selection
      const newRange = {
        from: date,
        to: date,
        preset: "custom" as DatePreset
      };
      setDateRange(newRange);

    } else {
      // If from date is set but not to date, complete selection
      const newRange = {
        from: dateRange.from,
        to: date < dateRange.from ? dateRange.from : date,
        preset: "custom" as DatePreset
      };
      setDateRange(newRange);
      setIsOpen(false);
      onChange(newRange);

    }
  };

  // Initialize with default range only if no value is provided
  useEffect(() => {
    if (!value) {

      onChange(dateRange);
    }
  }, []);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Select
        value={dateRange.preset}
        onValueChange={applyPreset}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[200px] justify-start text-left font-normal overflow-hidden text-ellipsis whitespace-nowrap"
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {formatDateRangeDisplay(dateRange, DATE_PRESETS)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => {
              if (range?.from) {
                handleDateSelect(range.from);
                if (range.to) {
                  const newRange = {
                    from: range.from,
                    to: range.to,
                    preset: "custom" as DatePreset
                  };
                  setDateRange(newRange);
                  setIsOpen(false);
                  onChange(newRange);

                }
              }
            }}
            numberOfMonths={2}
            defaultMonth={dateRange.from}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
