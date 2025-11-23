
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { type Notification } from '@/hooks/useNotifications';
import { format } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onDelete: (notificationId: string) => Promise<void>;
}

export const NotificationItem = ({ notification, onMarkAsRead, onDelete }: NotificationItemProps) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }

    if (notification.link) {
      // Check if it's a full URL (starts with http or https)
      if (notification.link.startsWith('http://') || notification.link.startsWith('https://')) {
        // Open external URL in new tab
        window.open(notification.link, '_blank', 'noopener,noreferrer');
      } else {
        // Handle as internal route
        navigate(notification.link);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(notification.id);
  };

  return (
    <div
      className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
        !notification.is_read ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-medium truncate ${
              !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notification.link && (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            
            <span className="text-xs text-muted-foreground">
              {format(new Date(notification.created_at), 'MMM d, HH:mm')}
            </span>
          </div>

          {notification.action_type && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-6 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {notification.action_type}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
