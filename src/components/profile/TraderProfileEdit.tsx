
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const socialPlatforms = [
  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
];

const statsVisibilityControls = [
  { key: 'net_pnl', label: 'Net P&L', description: 'Total profit and loss' },
  { key: 'win_rate', label: 'Win Rate', description: 'Percentage of winning trades' },
  { key: 'profit_factor', label: 'Profit Factor', description: 'Ratio of gross profit to gross loss' },
  { key: 'avg_win_loss', label: 'Avg Win/Loss', description: 'Average win to average loss ratio' },
  { key: 'account_balance', label: 'Account Balance', description: 'Current account balances' },
  { key: 'daily_pnl', label: 'Daily P&L Chart', description: 'Daily profit and loss chart' },
  { key: 'recent_trades', label: 'Recent Trades', description: 'List of recent trading activity' },
  { key: 'calendar_view', label: 'Calendar View', description: 'Trading calendar with performance' }
];

const traderProfileSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

type TraderProfileFormValues = z.infer<typeof traderProfileSchema>;

interface TraderProfileEditProps {
  onSave?: () => void;
  username?: string; // Add username prop to invalidate the correct query
}

export const TraderProfileEdit = ({ onSave, username }: TraderProfileEditProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

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

  const form = useForm<TraderProfileFormValues>({
    resolver: zodResolver(traderProfileSchema),
    defaultValues: {
      bio: "",
    },
  });

  // Load existing trader profile data
  useEffect(() => {
    const loadTraderProfile = async () => {
      if (!user?.id) return;

      try {
        console.log("TraderProfileEdit - Loading profile for user:", user.id);

        const { data: userIdData } = await supabase.rpc('get_user_id_from_auth', {
          auth_user_id: user.id
        });

        console.log("TraderProfileEdit - User ID:", userIdData);

        if (userIdData) {
          const { data: traderProfile, error } = await supabase
            .from('trader_profiles')
            .select('*')
            .eq('user_id', userIdData)
            .maybeSingle();

          if (error) {
            console.error("TraderProfileEdit - Error loading profile:", error);
            return;
          }

          console.log("TraderProfileEdit - Loaded trader profile:", traderProfile);

          if (traderProfile) {
            form.reset({
              bio: traderProfile.bio || "",
            });

            if (traderProfile.social_links) {
              setSocialLinks(traderProfile.social_links as Record<string, string>);
            }

            if (traderProfile.stats_visibility) {
              setStatsVisibility({
                ...statsVisibility,
                ...traderProfile.stats_visibility as Record<string, boolean>
              });
            }
          } else {
            console.log("TraderProfileEdit - No existing profile found, using defaults");
          }
        }
      } catch (error) {
        console.error('TraderProfileEdit - Error loading trader profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile settings",
          variant: "destructive",
        });
      }
    };

    loadTraderProfile();
  }, [user?.id]);

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const removeSocialLink = (platform: string) => {
    setSocialLinks(prev => {
      const newLinks = { ...prev };
      delete newLinks[platform];
      return newLinks;
    });
  };

  const handleStatsVisibilityChange = (stat: string, checked: boolean) => {
    setStatsVisibility(prev => ({
      ...prev,
      [stat]: checked
    }));
  };

  const onSubmit = async (values: TraderProfileFormValues) => {
    if (!user?.id) {
      console.error("TraderProfileEdit - No user ID available");
      return;
    }

    setIsLoading(true);
    try {
      console.log("TraderProfileEdit - Starting save process...");

      const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id_from_auth', {
        auth_user_id: user.id
      });

      if (userIdError) {
        console.error("TraderProfileEdit - Error getting user ID:", userIdError);
        throw userIdError;
      }

      if (userIdData) {
        // Clean up social links (remove empty values)
        const cleanedSocialLinks = Object.fromEntries(
          Object.entries(socialLinks).filter(([_, value]) => value.trim() !== '')
        );

        console.log('TraderProfileEdit - Saving social links:', cleanedSocialLinks);
        console.log('TraderProfileEdit - Saving stats visibility:', statsVisibility);

        const profileData = {
          user_id: userIdData,
          bio: values.bio || '',
          social_links: cleanedSocialLinks,
          stats_visibility: statsVisibility,
          is_public: true,
          updated_at: new Date().toISOString()
        };

        console.log('TraderProfileEdit - Final profile data:', profileData);

        const { error: saveError } = await supabase
          .from('trader_profiles')
          .upsert(profileData, {
            onConflict: 'user_id'
          });

        if (saveError) {
          console.error("TraderProfileEdit - Save error:", saveError);
          throw saveError;
        }

        console.log('TraderProfileEdit - Profile saved successfully');

        // Invalidate queries to refresh the UI
        if (username) {
          queryClient.invalidateQueries({ queryKey: ['traderProfile', username] });
        }
        queryClient.invalidateQueries({ queryKey: ['trader-profile'] });
        queryClient.invalidateQueries({ queryKey: ['community-traders'] });

        toast({
          title: "Success",
          description: "Trader profile updated successfully",
        });

        onSave?.();
      }
    } catch (error) {
      console.error('TraderProfileEdit - Error updating trader profile:', error);
      toast({
        title: "Error",
        description: "Failed to update trader profile. Please try again.",
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

          {/* Social Links Section */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.key} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={platform.key}>{platform.label}</Label>
                    <Input
                      id={platform.key}
                      value={socialLinks[platform.key] || ''}
                      onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                    />
                  </div>
                  {socialLinks[platform.key] && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSocialLink(platform.key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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

              {statsVisibilityControls.map((control) => (
                <div key={control.key} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <Label className="font-medium cursor-pointer" htmlFor={`stat-${control.key}`}>
                      {control.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {control.description}
                    </p>
                  </div>
                  <Switch
                    id={`stat-${control.key}`}
                    checked={statsVisibility[control.key as keyof typeof statsVisibility]}
                    onCheckedChange={(checked) => handleStatsVisibilityChange(control.key, checked)}
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
