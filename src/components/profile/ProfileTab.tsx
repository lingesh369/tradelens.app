import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  onSave?: () => void;
}

export const ProfileTab = ({ onSave }: ProfileTabProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [statsVisibility, setStatsVisibility] = useState({
    net_pnl: false,
    win_rate: true,
    profit_factor: true,
    avg_win_loss: true,
    account_balance: false,
    daily_pnl: true,
    recent_trades: true,
    calendar_view: true,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: "",
    },
  });

  // Load existing trader profile data
  useEffect(() => {
    const loadTraderProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: userIdData } = await supabase.rpc('get_user_id_from_auth', {
          auth_user_id: user.id
        });

        if (userIdData) {
          const { data: traderProfile, error } = await supabase
            .from('trader_profiles')
            .select('bio, stats_visibility')
            .eq('user_id', userIdData)
            .maybeSingle();

          if (error) {
            console.error("Error loading profile:", error);
            return;
          }

          if (traderProfile) {
            form.reset({
              bio: traderProfile.bio || "",
            });
            
            if (traderProfile.stats_visibility) {
              setStatsVisibility({
                ...statsVisibility,
                ...traderProfile.stats_visibility as Record<string, boolean>
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading trader profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile settings",
          variant: "destructive",
        });
      }
    };

    loadTraderProfile();
  }, [user?.id]);

  const handleStatsVisibilityChange = (stat: string, checked: boolean) => {
    setStatsVisibility(prev => ({
      ...prev,
      [stat]: checked
    }));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id_from_auth', {
        auth_user_id: user.id
      });

      if (userIdError) throw userIdError;

      if (userIdData) {
        const profileData = {
          user_id: userIdData,
          bio: values.bio || '',
          stats_visibility: statsVisibility,
          is_public: true,
          updated_at: new Date().toISOString()
        };

        const { error: saveError } = await supabase
          .from('trader_profiles')
          .upsert(profileData, {
            onConflict: 'user_id'
          });

        if (saveError) throw saveError;

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });

        onSave?.();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Bio Section */}
          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About You</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell other traders about yourself..."
                        className="min-h-[100px]"
                        maxLength={500}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right">
                      {field.value?.length || 0}/500
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Stats Visibility Section */}
          <Card>
            <CardHeader>
              <CardTitle>Stats Sharing Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose which statistics are visible to other traders on your profile.
              </p>
              
              {Object.entries(statsVisibility).map(([stat, enabled]) => (
                <div key={stat} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">
                      {stat.replace(/_/g, ' ')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat === 'net_pnl' && 'Your total profit/loss percentage'}
                      {stat === 'win_rate' && 'Your winning trade percentage'}
                      {stat === 'profit_factor' && 'Your profit factor ratio'}
                      {stat === 'avg_win_loss' && 'Average win vs loss comparison'}
                      {stat === 'account_balance' && 'Your account balance information'}
                      {stat === 'daily_pnl' && 'Daily profit/loss charts'}
                      {stat === 'recent_trades' && 'List of your recent trades'}
                      {stat === 'calendar_view' && 'Trading calendar and activity'}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => handleStatsVisibilityChange(stat, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
