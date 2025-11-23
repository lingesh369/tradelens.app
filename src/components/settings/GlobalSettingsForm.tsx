
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, DollarSign, AlertCircle } from "lucide-react";
import { useGlobalSettings, GlobalSettingsFormValues } from "@/hooks/useGlobalSettings";
import { useUserProfile } from "@/hooks/useUserProfile";
import { searchTimezones, getTimezoneByValue } from "@/lib/timezone-data";
import { currencyOptions } from "@/lib/currency-data";
import { Alert, AlertDescription } from "@/components/ui/alert";

const globalSettingsSchema = z.object({
  time_zone: z.string().min(1, "Please select a timezone"),
  base_currency: z.string().min(1, "Please select a currency"),
});

export function GlobalSettingsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const { profile, isLoading: profileLoading, isError: profileError } = useUserProfile();
  const { settings, isLoading: settingsLoading, saveSettings } = useGlobalSettings();

  const form = useForm<GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      time_zone: "Europe/London",
      base_currency: "USD",
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        time_zone: settings.time_zone || "Europe/London",
        base_currency: settings.base_currency || "USD",
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: GlobalSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await saveSettings(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter timezones based on search
  const filteredTimezones = searchTimezones(timezoneSearch);

  if (profileLoading || settingsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load user profile. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="time_zone"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Executions/Chart Timezone
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Select your preferred timezone to view your execution time as well as the charts.
                NOTE: This feature only works if your broker supports exporting time or executions.
              </p>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-80"
                    searchable={true}
                    searchPlaceholder="Search timezones..."
                    onSearch={setTimezoneSearch}
                  >
                    {filteredTimezones.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_currency"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Base Currency
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Select the default currency for displaying all monetary values.
                Assumes broker is sending execution prices at base currency.
              </p>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol}) - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
