
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrencyByCode } from "@/lib/currency-data";
import { getTimezoneByValue } from "@/lib/timezone-data";
import { useUserProfile } from "./useUserProfile";

export interface GlobalSettings {
  setting_id: string;
  user_id: string;
  time_zone: string | null;
  base_currency: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalSettingsFormValues {
  time_zone: string;
  base_currency: string;
}

export const useGlobalSettings = () => {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchSettings = async (): Promise<GlobalSettings | null> => {
    if (!profile?.user_id) {
      console.log('No profile ID available for settings');
      return null;
    }

    console.log('Fetching settings for profile ID:', profile.user_id);

    const { data, error } = await supabase
      .from('settings')
      .select('setting_id, user_id, time_zone, base_currency')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }

    return data;
  };

  const saveSettings = async (values: GlobalSettingsFormValues): Promise<GlobalSettings> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    console.log('Saving settings for profile ID:', profile.user_id, 'with values:', values);

    // First check if settings already exist for this user
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('setting_id')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({
          time_zone: values.time_zone,
          base_currency: values.base_currency,
        })
        .eq('user_id', profile.user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('settings')
        .insert([{
          user_id: profile.user_id,
          time_zone: values.time_zone,
          base_currency: values.base_currency,
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  };

  // Queries
  const settingsQuery = useQuery({
    queryKey: ["global-settings", profile?.user_id],
    queryFn: fetchSettings,
    enabled: !!profile?.user_id,
  });

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-settings", profile?.user_id] });
      toast({
        title: "Settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get formatted settings
  const getFormattedSettings = () => {
    const settings = settingsQuery.data;
    const timezone = settings?.time_zone ? getTimezoneByValue(settings.time_zone) : undefined;
    const currency = settings?.base_currency ? getCurrencyByCode(settings.base_currency) : undefined;
    
    return {
      timezone,
      currency,
      settings
    };
  };

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading || !profile,
    isError: settingsQuery.isError,
    error: settingsQuery.error,
    saveSettings: saveSettingsMutation.mutate,
    getFormattedSettings,
  };
};
