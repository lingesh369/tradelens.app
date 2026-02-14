import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, TraderProfile } from '@/lib/types/user';
import { useToast } from './use-toast';

export function useUserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery<UserProfile | null>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('app_users')
        .select(`
          *,
          trader_profile:trader_profiles(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      // Transform the data to match UserProfile type
      const profile = data as any;
      return {
        ...profile,
        trader_profile: Array.isArray(profile.trader_profile) 
          ? profile.trader_profile[0] 
          : profile.trader_profile
      } as UserProfile;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('No user');

      // Separate app_users and trader_profiles updates
      const { trader_profile, ...appUserUpdates } = updates;

      // Update app_users
      if (Object.keys(appUserUpdates).length > 0) {
        const { error: userError } = await supabase
          .from('app_users')
          .update(appUserUpdates)
          .eq('id', user.id);

        if (userError) throw userError;
      }

      // Update or create trader_profiles
      if (trader_profile) {
        const { error: profileError } = await supabase
          .from('trader_profiles')
          .upsert({
            user_id: user.id,
            ...trader_profile,
          }, { onConflict: 'user_id' });
        
        // Review:
        // 1. app_users has PK id.
        // 2. trader_profiles has PK id, but user_id is the unique FK.
        // 3. upserting without onConflict on a non-PK unique column can fail if Supabase doesn't auto-detect it correctly.
        // "duplicate key value violates unique constraint trader_profiles_user_id_key" confirms this is the issue.

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  };
}
