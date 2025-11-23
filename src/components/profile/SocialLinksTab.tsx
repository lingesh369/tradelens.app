import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Save, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

// Social platform configurations with colored SVG icons
const socialPlatforms = [
  {
    key: 'twitter',
    label: 'Twitter / X',
    placeholder: 'https://twitter.com/username',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
        <defs>
          <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#833ab4" />
            <stop offset="50%" stopColor="#fd1d1d" />
            <stop offset="100%" stopColor="#fcb045" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@username',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0077B5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  },
  {
    key: 'discord',
    label: 'Discord',
    placeholder: 'https://discord.gg/username',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
      </svg>
    )
  },
  {
    key: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/username',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0088CC">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    )
  },
  {
    key: 'website',
    label: 'Website',
    placeholder: 'https://yourwebsite.com',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#4285F4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    )
  }
];

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface SocialLinksTabProps {
  onSave?: () => void;
  username?: string;
}

export const SocialLinksTab = ({ onSave, username }: SocialLinksTabProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);

  // Load existing social links
  useEffect(() => {
    const loadSocialLinks = async () => {
      if (!user?.id) return;

      try {
        const { data: userIdData } = await supabase.rpc('get_user_id_from_auth', {
          auth_user_id: user.id
        });

        if (userIdData) {
          const { data: traderProfile, error } = await supabase
            .from('trader_profiles')
            .select('social_links')
            .eq('user_id', userIdData)
            .maybeSingle();

          if (error) {
            console.error("Error loading social links:", error);
            return;
          }

          if (traderProfile && traderProfile.social_links) {
            const profileData = traderProfile.social_links as Record<string, any>;
            
            // Extract social links (exclude custom_links_data)
            const socialLinksData = { ...profileData };
            delete socialLinksData.custom_links_data;
            setSocialLinks(socialLinksData);
            
            // Extract custom links from the special key
            if (profileData.custom_links_data && Array.isArray(profileData.custom_links_data)) {
              setCustomLinks(profileData.custom_links_data as CustomLink[]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading social links:', error);
      }
    };

    loadSocialLinks();
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

  const addCustomLink = () => {
    const newLink: CustomLink = {
      id: Date.now().toString(),
      label: '',
      url: ''
    };
    setCustomLinks(prev => [...prev, newLink]);
  };

  const updateCustomLink = (id: string, field: 'label' | 'url', value: string) => {
    setCustomLinks(prev => 
      prev.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    );
  };

  const removeCustomLink = (id: string) => {
    setCustomLinks(prev => prev.filter(link => link.id !== id));
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty URLs are valid (will be removed)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate all URLs
    const invalidSocialLinks = Object.entries(socialLinks).filter(([_, url]) => !validateUrl(url));
    const invalidCustomLinks = customLinks.filter(link => !validateUrl(link.url) || (link.url && !link.label));

    if (invalidSocialLinks.length > 0 || invalidCustomLinks.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please ensure all URLs are valid and custom links have both label and URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: userIdData, error: userIdError } = await supabase.rpc('get_user_id_from_auth', {
        auth_user_id: user.id
      });

      if (userIdError) throw userIdError;

      if (userIdData) {
        // Clean up social links (remove empty values)
        const cleanedSocialLinks = Object.fromEntries(
          Object.entries(socialLinks).filter(([_, value]) => value.trim() !== '')
        );

        // Clean up custom links (remove empty ones)
        const cleanedCustomLinks = customLinks.filter(link => 
          link.label.trim() !== '' && link.url.trim() !== ''
        );

        // Combine social links and custom links into a single object
        const combinedData = {
          ...cleanedSocialLinks,
          custom_links_data: cleanedCustomLinks
        };

        const { error: saveError } = await supabase
          .from('trader_profiles')
          .upsert({
            user_id: userIdData,
            social_links: combinedData,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (saveError) throw saveError;

        toast({
          title: "Success",
          description: "Social links updated successfully",
        });

        // Invalidate trader profile queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['trader-profile'] });
        queryClient.invalidateQueries({ queryKey: ['trader-profiles'] });
        if (username) {
          queryClient.invalidateQueries({ queryKey: ['trader-profile', username] });
        }

        onSave?.();
      }
    } catch (error) {
      console.error('Error updating social links:', error);
      toast({
        title: "Error",
        description: "Failed to update social links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialPlatforms.map((platform) => (
            <div key={platform.key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="text-muted-foreground">
                  {platform.icon}
                </div>
                <Label className="text-sm font-medium">{platform.label}</Label>
              </div>
              <div className="flex-1">
                <Input
                  value={socialLinks[platform.key] || ''}
                  onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className={!validateUrl(socialLinks[platform.key] || '') ? 'border-red-500' : ''}
                />
              </div>
              {socialLinks[platform.key] && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(socialLinks[platform.key], '_blank')}
                    disabled={!validateUrl(socialLinks[platform.key])}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSocialLink(platform.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Share Your Tools
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomLink}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Link
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tag your trading platforms & tools with affiliate links.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {customLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No custom links added yet. Click "Add Custom Link" to get started.
            </p>
          ) : (
            customLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <div className="text-muted-foreground">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <Input
                    value={link.label}
                    onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)}
                    placeholder="Link name"
                    className="w-24"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={link.url}
                    onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                    placeholder="https://"
                    className={!validateUrl(link.url) ? 'border-red-500' : ''}
                  />
                </div>
                {link.url && validateUrl(link.url) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomLink(link.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Social Links
          </>
        )}
      </Button>
    </div>
  );
};