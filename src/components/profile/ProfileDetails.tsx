
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
import { Loader2, Save, Edit, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UsernameInput } from '@/components/ui/username-input';
import { ProfilePictureUpload } from '@/components/ui/profile-picture-upload';
import { Switch } from '@/components/ui/switch';
import { useUserProfile } from '@/hooks/useUserProfile';

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileDetails: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, isLoading, updateProfile, isUpdating } = useUserProfile();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      username: profile?.username || "",
      email: profile?.email || user?.email || "",
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        email: profile.email || user?.email || "",
      });
    }
  }, [profile, user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!isUsernameValid) {
      toast({
        title: "Invalid Username",
        description: "Please choose a valid and available username.",
        variant: "destructive",
      });
      return;
    }

    updateProfile({
      first_name: values.firstName,
      last_name: values.lastName,
      username: values.username,
    });

    setIsEditing(false);
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
    updateProfile({ avatar_url: url });
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    if (!profile) return;
    
    updateProfile({
      trader_profile: {
        is_public: checked,
        bio: profile.trader_profile?.bio || '',
        stats_visibility: profile.trader_profile?.stats_visibility || {
          show_pnl: false,
          show_win_rate: true,
          show_trades: true,
        },
      } as any, // Partial update - upsert will handle missing fields
    });
  };

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
          <p className="text-sm text-muted-foreground">Please refresh the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex gap-6 items-start">
        <ProfilePictureUpload
          currentImageUrl={profile.avatar_url}
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
            {profile.is_active !== undefined && (
              <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                profile.is_active
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.is_active ? 'Active' : 'Inactive'}
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
              checked={profile.trader_profile?.is_public || false}
              onCheckedChange={handlePrivacyToggle}
              disabled={isUpdating}
            />
          </div>
        </div>
        {profile.trader_profile?.is_public && (
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
              disabled={isUpdating}
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
            <Button type="submit" className="w-full" disabled={isUpdating || !isUsernameValid}>
              {isUpdating ? (
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
