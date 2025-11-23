
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Edit, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { UsernameInput } from '@/components/ui/username-input';
import { ProfilePictureUpload } from '@/components/ui/profile-picture-upload';
import { Switch } from '@/components/ui/switch';
import { useCreateTraderProfile } from '@/hooks/useCommunity';
import { ExternalLink } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  user_role: string;
  user_status: string;
  created_at?: string;
  updated_at?: string;
  profile_picture_url?: string;
}

const ProfileDetails: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [traderProfile, setTraderProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const createTraderProfile = useCreateTraderProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
    },
  });

  const fetchProfile = async () => {
    if (!user) {
      console.log('No authenticated user found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching profile for user:', user.id);
      
      // First try with the security definer function approach
      const { data: userData, error: userError } = await supabase.rpc('get_user_id_from_auth', {
        auth_user_id: user.id
      });

      if (userError) {
        console.error('Error getting user ID:', userError);
        // Fallback to direct query if function fails
        const { data: directData, error: directError } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (directError) {
          console.error('Direct query also failed:', directError);
          throw directError;
        }

        console.log('Fallback direct query succeeded:', directData);
        setProfile(directData);
        
        // Update form with fetched data
        form.reset({
          firstName: directData.first_name || "",
          lastName: directData.last_name || "",
          username: directData.username || "",
          email: directData.email || user.email || "",
        });
        setIsLoading(false);
        return;
      }

      // If we got a user ID from the function, fetch the full profile
      if (userData) {
        const { data: profileData, error: profileError } = await supabase
          .from('app_users')
          .select('*')
          .eq('user_id', userData)
          .single();

        if (profileError) {
          console.error('Error fetching profile with user ID:', profileError);
          throw profileError;
        }

      console.log('Profile data fetched successfully:', profileData);
      setProfile(profileData);
      
      // Fetch trader profile for privacy settings
      // Use profileData.user_id instead of profileData.id for trader_profiles
      const { data: traderData } = await supabase
        .from('trader_profiles')
        .select('*')
        .eq('user_id', profileData.user_id)
        .maybeSingle();
      
      if (traderData) {
        setTraderProfile(traderData);
        setIsPublic(traderData.is_public);
      }
      
      // Update form with fetched data
      form.reset({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        username: profileData.username || "",
        email: profileData.email || user.email || "",
      });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      
      console.log('No profile found - database trigger should have created it');
      toast({
        title: "Profile Not Found",
        description: "Your profile is being created. Please refresh the page in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('Updating profile with values:', values);

      // Check if username is valid before submitting
      if (!isUsernameValid) {
        toast({
          title: "Invalid Username",
          description: "Please choose a valid and available username.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          username: values.username,
          updated_at: new Date().toISOString()
        } as any)
        .eq('auth_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEditing = () => {
    if (isEditing && profile) {
      // Reset form to original values when canceling
      form.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        email: profile.email || user?.email || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    } else if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    } else if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    } else if (profile?.first_name) {
      return profile.first_name;
    } else if (profile?.username) {
      return profile.username;
    } else if (profile?.email) {
      return profile.email.split('@')[0];
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const handleProfilePictureUpload = (url: string) => {
    if (profile) {
      setProfile({ ...profile, profile_picture_url: url });
    }
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    if (!profile) return;
    
    try {
      setIsPublic(checked);
      
      if (checked && !traderProfile) {
        // Create trader profile if it doesn't exist
        const profileData = {
          user_id: profile.user_id,
          is_public: true,
          bio: '',
          stats_visibility: {
            "net_pnl": false,
            "win_rate": true,
            "daily_pnl": true,
            "avg_win_loss": true,
            "calendar_view": true,
            "profit_factor": true,
            "recent_trades": true,
            "account_balance": false
          },
          social_links: {},
          about_content: []
        };
        
        await createTraderProfile.mutateAsync(profileData);
        setTraderProfile(profileData);
      } else if (traderProfile) {
        // Update existing trader profile
        // Use profile.user_id to match the RLS policy expectation
        const { error } = await supabase
          .from('trader_profiles')
          .update({ is_public: checked })
          .eq('user_id', profile.user_id);
          
        if (error) throw error;
        
        setTraderProfile({ ...traderProfile, is_public: checked });
      }
      
      toast({
        title: "Privacy Updated",
        description: checked 
          ? "Your profile is now public and visible in the community" 
          : "Your profile is now private",
      });
    } catch (error) {
      console.error('Error updating privacy:', error);
      setIsPublic(!checked); // Revert on error
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No profile data found</p>
          <Button onClick={fetchProfile} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex gap-6 items-start">
        <ProfilePictureUpload
          currentImageUrl={profile.profile_picture_url}
          onImageUploaded={handleProfilePictureUpload}
          userInitials={getInitials()}
        />
        
        <div className="space-y-2">
          <h3 className="text-xl font-medium">
            {getDisplayName()}
          </h3>
          <p className="text-muted-foreground">{profile.email || user?.email}</p>
          <div className="flex gap-2">
            {profile.user_role && (
              <div className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {profile.user_role}
              </div>
            )}
            {profile.user_status && (
              <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                profile.user_status.toLowerCase() === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.user_status}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Public Profile (moved above Personal Information, heading removed) */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium">Public Profile</p>
            <p className="text-sm text-muted-foreground">
              Make your profile visible in the community and allow others to see your shared trades
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Link icon to public trader profile */}
            <a
              href={profile?.username ? `/traders/${profile.username}` : "#"}
              title="View public profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open public profile"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Switch
              checked={isPublic}
              onCheckedChange={handlePrivacyToggle}
              disabled={createTraderProfile.isPending}
            />
          </div>
        </div>
        {isPublic && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your profile is public. You can manage what information is visible in your
              trader profile settings.
            </p>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleEditing}
              disabled={isSubmitting}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted/40" : ""}
                      placeholder="Enter your first name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted/40" : ""}
                      placeholder="Enter your last name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    {isEditing ? (
                      <UsernameInput
                        {...field}
                        placeholder="Enter your username"
                        currentUsername={profile?.username}
                        onValidityChange={setIsUsernameValid}
                      />
                    ) : (
                      <Input
                        {...field}
                        readOnly={true}
                        className="bg-muted/40"
                        placeholder="Enter your username"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly={true}
                    className="bg-muted/40"
                    placeholder="Email address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
            <Button type="submit" className="w-full" disabled={isSubmitting || !isUsernameValid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
};

export default ProfileDetails;
