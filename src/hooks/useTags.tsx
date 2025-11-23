
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

export interface Tag {
  tag_id: string;
  user_id: string;
  tag_name: string;
  tag_type: string;
  description: string | null;
  linked_strategies: string | null;
  linked_trades: string | null;
}

export interface TagFormValues {
  tag_name: string;
  tag_type: string;
  description?: string | null;
}

export function useTags() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchTags = async (): Promise<Tag[]> => {
    if (!profile?.user_id) {
      console.log('No profile user_id available for tags');
      return [];
    }

    console.log('Fetching tags for profile ID:', profile.user_id);

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("tag_name", { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
    
    console.log('Tags fetched successfully:', data);
    return data || [];
  };

  const createTag = async (tag: TagFormValues): Promise<Tag> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { data, error } = await supabase
      .from("tags")
      .insert([{ ...tag, user_id: profile.user_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateTag = async ({ tag_id, tagData }: { tag_id: string; tagData: TagFormValues }): Promise<Tag> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { data, error } = await supabase
      .from("tags")
      .update(tagData)
      .eq("tag_id", tag_id)
      .eq("user_id", profile.user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteTag = async (tag_id: string): Promise<void> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("tag_id", tag_id)
      .eq("user_id", profile.user_id);

    if (error) throw error;
  };

  const tagsQuery = useQuery({
    queryKey: ["tags", profile?.user_id],
    queryFn: fetchTags,
    enabled: !!profile?.user_id,
    staleTime: 1000 * 60, // 1 minute
  });

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", profile?.user_id] });
      toast({
        title: "Tag created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error in createTagMutation:', error);
      toast({
        title: "Error creating tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", profile?.user_id] });
      toast({
        title: "Tag updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error in updateTagMutation:', error);
      toast({
        title: "Error updating tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", profile?.user_id] });
      toast({
        title: "Tag deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error in deleteTagMutation:', error);
      toast({
        title: "Error deleting tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    isError: tagsQuery.isError,
    error: tagsQuery.error,
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    refetch: tagsQuery.refetch,
  };
}
