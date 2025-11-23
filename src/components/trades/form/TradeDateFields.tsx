
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { UseFormReturn } from "react-hook-form";
import { TradeFormValues } from "../TradeFormSchema";

interface TradeDateFieldsProps {
  form: UseFormReturn<TradeFormValues>;
}

export function TradeDateFields({ form }: TradeDateFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="entryDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Entry Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${
                      !field.value && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="entryTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Entry Time</FormLabel>
            <FormControl>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  {...field}
                  className="pl-10"
                  step="60"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="exitDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Exit Date (Optional)</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${
                      !field.value && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value || undefined}
                  onSelect={field.onChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormDescription>Leave blank for open trades</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="exitTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exit Time (Optional)</FormLabel>
            <FormControl>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  {...field}
                  value={field.value || ""}
                  className="pl-10"
                  step="60"
                />
              </div>
            </FormControl>
            <FormDescription>Leave blank for open trades</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
