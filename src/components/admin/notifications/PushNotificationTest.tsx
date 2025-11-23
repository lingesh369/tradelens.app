
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebPush } from '@/hooks/useWebPush';
import { Bell, TestTube, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const PushNotificationTest = () => {
  const { 
    permission, 
    isSubscribed, 
    isLoading, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    testNotification 
  } = useWebPush();

  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await testNotification();
    setTimeout(() => setTesting(false), 2000);
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Not Asked</Badge>;
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notification Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Permission:</span>
            {getPermissionBadge()}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscription:</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {permission !== 'granted' && (
            <Button 
              onClick={requestPermission} 
              className="w-full"
              variant="outline"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Request Permission
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button 
              onClick={subscribe} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Subscribing...' : 'Enable Push Notifications'}
            </Button>
          )}

          {isSubscribed && (
            <>
              <Button 
                onClick={handleTest} 
                className="w-full"
                disabled={testing}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test Notification'}
              </Button>
              
              <Button 
                onClick={unsubscribe} 
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Disable Notifications
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Push notifications work best in:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Chrome, Firefox, Edge (latest versions)</li>
            <li>HTTPS websites (localhost works too)</li>
            <li>When the browser has notification permissions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
