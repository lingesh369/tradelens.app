
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { TradeFormValues } from "../TradeFormSchema";

interface TradeNotesFieldProps {
  form: UseFormReturn<TradeFormValues>;
}

export function TradeNotesField({ form }: TradeNotesFieldProps) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Add any additional notes about this trade"
              className="min-h-[100px]"
              {...field} 
              value={field.value || ""}
              dir="ltr"
              style={{ textAlign: "left" }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
