
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ExternalLink, Users, Calendar, Mail, Smartphone } from 'lucide-react';

interface NotificationPreviewProps {
  notification: {
    title: string;
    message: string;
    link?: string;
    action_type?: string;
    type: string;
    target_type: string;
    send_in_app: boolean;
    send_email: boolean;
    send_push: boolean;
    is_scheduled: boolean;
    scheduled_for?: string;
    timezone?: string;
    repeat_type?: string;
  };
  targetCount: number;
  targetDescription: string;
  onClose: () => void;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({
  notification,
  targetCount,
  targetDescription,
  onClose
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'platform_update':
        return 'bg-blue-100 text-blue-800';
      case 'payment_alert':
        return 'bg-red-100 text-red-800';
      case 'account_activity':
        return 'bg-green-100 text-green-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'promotional':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryChannels = () => {
    const channels = [];
    if (notification.send_in_app) channels.push({ name: 'In-App', icon: Bell });
    if (notification.send_email) channels.push({ name: 'Email', icon: Mail });
    if (notification.send_push) channels.push({ name: 'Push', icon: Smartphone });
    return channels;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Audience Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Target Audience</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {targetDescription} ({targetCount} users)
            </p>
          </div>

          {/* Delivery Channels */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Delivery Channels</span>
            </div>
            <div className="flex gap-2">
              {getDeliveryChannels().map((channel, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <channel.icon className="h-3 w-3" />
                  {channel.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Scheduling Info */}
          {notification.is_scheduled && notification.scheduled_for && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Scheduled Delivery</span>
              </div>
              <p className="text-sm">
                {new Date(notification.scheduled_for).toLocaleString()} ({notification.timezone})
              </p>
              {notification.repeat_type !== 'once' && (
                <p className="text-sm text-muted-foreground">
                  Repeats: {notification.repeat_type}
                </p>
              )}
            </div>
          )}

          {/* In-App Notification Preview */}
          <div>
            <h3 className="font-medium mb-3">In-App Notification Preview</h3>
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {notification.title}
                    </h4>
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTypeColor(notification.type)}`}
                      >
                        {notification.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      
                      {notification.link && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      Now
                    </span>
                  </div>

                  {notification.action_type && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-6 text-xs"
                    >
                      {notification.action_type}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          {notification.send_email && (
            <div>
              <h3 className="font-medium mb-3">Email Preview</h3>
              <div className="border rounded-lg p-4 bg-background">
                <div className="border-b pb-2 mb-3">
                  <div className="text-sm font-medium">Subject: {notification.title}</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">{notification.message}</p>
                  {notification.link && notification.action_type && (
                    <div className="pt-2">
                      <Button size="sm" className="text-xs">
                        {notification.action_type}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
