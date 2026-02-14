import { supabase } from '@/integrations/supabase/client';

interface LinkMetadata {
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  siteName: string;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'link' | 'image' | 'section';
  content: any;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Fetch profile about data for a specific user
 * @param profileId - The user's profile ID
 * @returns The bio and about_content for the profile
 */
export const fetchProfileAbout = async (profileId: string) => {
  try {
    // First try to use the Edge Function
    const response = await fetch(`${supabase.functions.url}/profile-about/profile/${profileId}/about`);
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to direct database query if Edge Function fails
    console.warn('Edge function failed, falling back to direct query');
    const { data, error } = await supabase
      .from('trader_profiles')
      .select('bio, about_content')
      .eq('user_id', profileId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile about data:', error);
    throw error;
  }
};

/**
 * Save profile about data for the current user
 * @param profileId - The user's profile ID
 * @param bio - The user's bio text
 * @param blocks - The content blocks for the about section
 * @returns The updated profile data
 */
export const saveProfileAbout = async (profileId: string, bio: string, blocks: ContentBlock[]) => {
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    // First try to use the Edge Function
    const response = await fetch(`${supabase.functions.url}/profile-about/profile/${profileId}/about`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bio, blocks })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to direct database update if Edge Function fails
    console.warn('Edge function failed, falling back to direct update');
    const { data, error } = await supabase
      .from('trader_profiles')
      .update({ 
        bio: bio,
        about_content: blocks
      })
      .eq('user_id', profileId)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving profile about data:', error);
    throw error;
  }
};

/**
 * Fetch metadata for a link
 * @param url - The URL to fetch metadata for
 * @returns The link metadata
 */
export const fetchLinkMetadata = async (url: string): Promise<LinkMetadata> => {
  try {
    // First try to use the Edge Function
    const response = await fetch(`${supabase.functions.url}/profile-about/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to client-side implementation
    console.warn('Edge function failed, falling back to client-side implementation');
    // Import the client-side implementation dynamically to avoid circular dependencies
    const { fetchLinkMetadata: clientFetchLinkMetadata } = await import('./linkMetadataService');
    return await clientFetchLinkMetadata(url);
  } catch (error) {
    console.error('Error fetching link metadata:', error);
    // Import the client-side implementation dynamically
    const { fetchLinkMetadata: clientFetchLinkMetadata } = await import('./linkMetadataService');
    return await clientFetchLinkMetadata(url);
  }
};
