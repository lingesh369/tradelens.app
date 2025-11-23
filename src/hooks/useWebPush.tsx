
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAppUserId } from '@/hooks/useAppUserId';

export const useWebPush = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { appUserId } = useAppUserId();
  const { toast } = useToast();

  // We'll get the VAPID public key from the edge function
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getVapidPublicKey = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      if (error) throw error;
      setVapidPublicKey(data.publicKey);
    } catch (error) {
      console.error('Error getting VAPID public key:', error);
    }
  }, []);

  const checkPermission = useCallback(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Browser not supported',
        description: 'This browser does not support notifications.',
        variant: 'destructive'
      });
      return false;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive push notifications.'
        });
        return true;
      } else {
        toast({
          title: 'Notifications blocked',
          description: 'You can enable notifications in your browser settings.',
          variant: 'destructive'
        });
        return false;
      }
    }
    
    return true;
  }, [toast]);

  const subscribe = useCallback(async () => {
    if (!user || !appUserId || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging not supported or user not logged in');
      return false;
    }

    if (!vapidPublicKey) {
      toast({
        title: 'Configuration error',
        description: 'VAPID keys not configured. Please contact support.',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        setIsSubscribed(true);
        return true;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Push subscription created:', subscription);

      // Store subscription in Supabase using app user ID
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: appUserId,
          subscription_data: subscription.toJSON() as any
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Push notifications enabled',
        description: 'You will receive push notifications for new updates.'
      });
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription failed',
        description: `Failed to set up push notifications: ${error}`,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, appUserId, toast, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    if (!user || !appUserId) return;

    setIsLoading(true);

    try {
      // Remove from Supabase using app user ID
      const { error } = await supabase
        .from('user_push_tokens')
        .delete()
        .eq('user_id', appUserId);

      if (error) throw error;

      // Unsubscribe from browser
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      setIsSubscribed(false);
      toast({
        title: 'Unsubscribed',
        description: 'Push notifications disabled.'
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, appUserId, toast]);

  const checkSubscription = useCallback(async () => {
    if (!user || !appUserId) return;

    try {
      // Query using app user ID and expect array response
      const { data, error } = await supabase
        .from('user_push_tokens')
        .select('subscription_data')
        .eq('user_id', appUserId);

      if (error) throw error;
      
      // Check if we have any subscriptions
      setIsSubscribed(data && data.length > 0);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  }, [user, appUserId]);

  const testNotification = useCallback(async () => {
    if (!isSubscribed || !user) {
      toast({
        title: 'Not subscribed',
        description: 'Please enable push notifications first.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Call the send-web-push edge function for testing
      const { error } = await supabase.functions.invoke('send-web-push', {
        body: {
          userIds: [user.id],
          title: 'Test Notification',
          message: 'This is a test push notification from TradeLens!',
          url: '/'
        }
      });

      if (error) throw error;

      toast({
        title: 'Test notification sent',
        description: 'Check if you received the push notification.'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Test failed',
        description: 'Failed to send test notification.',
        variant: 'destructive'
      });
    }
  }, [isSubscribed, user, toast]);

  // Initialize on mount
  useEffect(() => {
    if (!user) return;

    checkPermission();
    checkSubscription();
    getVapidPublicKey();
  }, [user, checkSubscription, getVapidPublicKey]);

  return {
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
    testNotification
  };
};
