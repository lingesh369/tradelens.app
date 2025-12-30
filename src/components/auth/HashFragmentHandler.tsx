import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const HashFragmentHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleHashFragment = async () => {
      // Check if we have hash fragments in the URL (OAuth redirect)
      if (window.location.hash) {
        try {
          console.log('Processing hash fragment redirect:', window.location.hash);
          
          // Parse the hash fragment (format: #access_token=...&refresh_token=...)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const expiresIn = hashParams.get('expires_in');
          const tokenType = hashParams.get('token_type');
          const providerToken = hashParams.get('provider_token');
          
          if (accessToken) {
            console.log('OAuth redirect detected with access token');
            
            // Set the session manually using the tokens from the hash fragment
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('Error setting session from hash fragment:', error);
              toast({
                title: 'Authentication Error',
                description: 'Failed to process authentication. Please try again.',
                variant: 'destructive',
              });
              navigate('/auth');
              return;
            }
            
            if (session) {
              console.log('Session set successfully from hash fragment');
              
              // Clear the hash fragment from the URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Redirect to dashboard
              navigate('/dashboard');
              
              toast({
                title: 'Welcome!',
                description: 'You have successfully signed in with Google.',
              });
            }
          }
        } catch (error) {
          console.error('Error processing hash fragment:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to process authentication. Please try again.',
            variant: 'destructive',
          });
          navigate('/auth');
        }
      }
    };

    handleHashFragment();
  }, [navigate, toast]);

  return null;
};

export default HashFragmentHandler;