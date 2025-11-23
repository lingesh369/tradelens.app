
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto w-full", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-base font-medium dark:text-white text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 p-0 opacity-70 hover:opacity-100 dark:bg-[#25232f] dark:border-[#33313e] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#33313e]",
          "bg-background border-border text-foreground hover:bg-muted"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "dark:text-slate-400 text-muted-foreground w-full font-medium text-[0.8rem] rounded-md",
        row: "flex w-full mt-0",
        cell: "relative h-9 w-9 p-0 text-center text-sm rounded-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal dark:text-slate-300 text-foreground aria-selected:opacity-100 dark:hover:bg-[#33313e] hover:bg-muted rounded-md hover:text-foreground dark:hover:text-white"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "dark:bg-[#33313e] dark:text-white bg-muted text-foreground font-medium",
        day_outside: "dark:text-slate-500 text-muted-foreground opacity-50",
        day_disabled: "dark:text-slate-500 text-muted-foreground opacity-50",
        day_range_middle:
          "dark:aria-selected:bg-[#33313e] dark:aria-selected:text-slate-300 aria-selected:bg-muted/70 aria-selected:text-muted-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        ...props.components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
