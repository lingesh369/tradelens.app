
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import { MultiSelectAccountSelector, SelectedAccounts } from "@/components/filters/MultiSelectAccountSelector";
import { DateRangeSelector, DateRange } from "@/components/filters/DateRangeSelector";
import { getPresetDateRange } from "@/components/filters/DateRangeUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AccountDateSettingsProps {
  onSave?: () => void;
}

export const AccountDateSettings = ({ onSave }: AccountDateSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Default to "All Accounts" and "All Time"
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccounts>({
    allAccounts: true,
    accountIds: []
  });

  const [dateRange, setDateRange] = useState<DateRange>(getPresetDateRange("allTime"));
  
  // Stat visibility toggles
  const [showPnL, setShowPnL] = useState(true);
  const [showWinRate, setShowWinRate] = useState(true);

  console.log("AccountDateSettings - Current state:", {
    selectedAccounts,
    dateRange
  });

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        console.log("AccountDateSettings - Loading settings for user:", user.id);
        
        const { data: userIdData } = await supabase.rpc('get_user_id_from_auth', {
          auth_user_id: user.id
        });

        if (userIdData) {
          const { data: traderProfile, error } = await supabase
            .from('trader_profiles')
            .select('privacy_settings')
            .eq('user_id', userIdData)
            .maybeSingle();

          if (error) {
            console.error("AccountDateSettings - Error loading settings:", error);
            return;
          }

          console.log("AccountDateSettings - Loaded privacy settings:", traderProfile?.privacy_settings);

          if (traderProfile?.privacy_settings) {
            const privacySettings = traderProfile.privacy_settings as any;
            
            // Load selected accounts
            if (privacySettings.selected_account_ids !== undefined) {
              const newSelectedAccounts = {
                allAccounts: privacySettings.selected_account_ids.length === 0,
                accountIds: privacySettings.selected_account_ids || []
              };
              console.log("AccountDateSettings - Setting selected accounts:", newSelectedAccounts);
              setSelectedAccounts(newSelectedAccounts);
            }
            
            // Load date range
            if (privacySettings.date_range && privacySettings.date_range.from && privacySettings.date_range.to) {
              try {
                const newDateRange = {
                  from: new Date(privacySettings.date_range.from),
                  to: new Date(privacySettings.date_range.to),
                  preset: privacySettings.date_range.preset || "allTime"
                };
                console.log("AccountDateSettings - Setting date range:", newDateRange);
                setDateRange(newDateRange);
              } catch (dateError) {
                console.error("AccountDateSettings - Error parsing dates:", dateError);
              }
            }
            
            // Load stat visibility settings
            if (privacySettings.stat_visibility !== undefined) {
              setShowPnL(privacySettings.stat_visibility.show_pnl !== false);
              setShowWinRate(privacySettings.stat_visibility.show_win_rate !== false);
              console.log("AccountDateSettings - Setting stat visibility:", {
                showPnL: privacySettings.stat_visibility.show_pnl !== false,
                showWinRate: privacySettings.stat_visibility.show_win_rate !== false
              });
            }
          }
        }
      } catch (error) {
        console.error('AccountDateSettings - Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  const handleAccountsChange = (newSelectedAccounts: SelectedAccounts) => {
    console.log("AccountDateSettings - Accounts changed:", newSelectedAccounts);
    setSelectedAccounts(newSelectedAccounts);
  };

  const handleDateRangeChange = (newDateRange: DateRange) => {
    console.log("AccountDateSettings - Date range changed:", newDateRange);
    setDateRange(newDateRange);
  };

  const handleSave = async () => {
    if (!user?.id) {
      console.error("AccountDateSettings - No user ID available");
      return;
    }

    setIsSaving(true);
    try {
      console.log("AccountDateSettings - Starting save process...");
      
      const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id_from_auth', {
        auth_user_id: user.id
      });

      if (userIdError) {
        console.error("AccountDateSettings - Error getting user ID:", userIdError);
        throw userIdError;
      }

      if (userIdData) {
        // Prepare privacy settings
        const privacySettings = {
          selected_account_ids: selectedAccounts.allAccounts ? [] : selectedAccounts.accountIds,
          date_range: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
            preset: dateRange.preset
          },
          stat_visibility: {
            show_pnl: showPnL,
            show_win_rate: showWinRate
          }
        };

        console.log('AccountDateSettings - Saving privacy settings:', privacySettings);

        // First check if profile exists
        const { data: existingProfile } = await supabase
          .from('trader_profiles')
          .select('id')
          .eq('user_id', userIdData)
          .maybeSingle();

        let saveError;
        
        if (existingProfile) {
          // Update existing profile
          const { error } = await supabase
            .from('trader_profiles')
            .update({ 
              privacy_settings: privacySettings,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userIdData);
          saveError = error;
        } else {
          // Create new profile
          const { error } = await supabase
            .from('trader_profiles')
            .insert({ 
              user_id: userIdData,
              privacy_settings: privacySettings,
              is_public: false
            });
          saveError = error;
        }

        if (saveError) {
          console.error("AccountDateSettings - Save error:", saveError);
          throw saveError;
        }

        console.log('AccountDateSettings - Settings saved successfully');

        toast({
          title: "Settings saved",
          description: "Your account and date range settings have been updated successfully.",
        });

        onSave?.();
      }
    } catch (error) {
      console.error('AccountDateSettings - Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure which accounts and date range to share publicly on your trader profile.
          </p>
          
          {/* Account Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Shared Accounts</Label>
            <MultiSelectAccountSelector
              onChange={handleAccountsChange}
              selectedAccounts={selectedAccounts}
            />
            <p className="text-xs text-muted-foreground">
              {selectedAccounts.allAccounts 
                ? "All accounts will be visible on your public profile" 
                : `${selectedAccounts.accountIds.length} account${selectedAccounts.accountIds.length === 1 ? '' : 's'} selected for public sharing`
              }
            </p>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data Range</Label>
            <DateRangeSelector
              onChange={handleDateRangeChange}
              value={dateRange}
            />
            <p className="text-xs text-muted-foreground">
              Only trades within this date range will be visible on your public profile
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stat Visibility Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Stat Visibility Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control which statistics are visible on your public trader profile.
          </p>
          
          {/* Show/Hide P&L Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show/Hide P&L</Label>
              <p className="text-xs text-muted-foreground">
                Display your profit and loss statistics on your profile
              </p>
            </div>
            <Switch
              checked={showPnL}
              onCheckedChange={setShowPnL}
            />
          </div>

          {/* Show/Hide Win Rate Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show/Hide Win Rate</Label>
              <p className="text-xs text-muted-foreground">
                Display your win rate percentage on your profile
              </p>
            </div>
            <Switch
              checked={showWinRate}
              onCheckedChange={setShowWinRate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
};
