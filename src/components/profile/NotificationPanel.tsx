
import React from 'react';
import { X, Heart, UserPlus, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useProfileNotifications, type ProfileNotification } from '@/hooks/useProfileNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart className="h-4 w-4 text-red-500" />;
    case 'follow':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'trade_share':
      return <Share2 className="h-4 w-4 text-purple-500" />;
    default:
      return <Heart className="h-4 w-4" />;
  }
};

const NotificationItem: React.FC<{ 
  notification: ProfileNotification; 
  onMarkAsRead: (id: string) => void;
  onClick: () => void;
}> = ({ notification, onMarkAsRead, onClick }) => {
  const handleClick = () => {
    if (notification.status === 'unread') {
      onMarkAsRead(notification.id);
    }
    onClick();
  };

  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
        notification.status === 'unread' ? 'bg-primary/5 border-l-4 border-l-primary' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.source_user?.profile_picture_url} />
          <AvatarFallback>
            {notification.source_user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getNotificationIcon(notification.type)}
            <p className="text-sm font-medium truncate">
              {notification.title}
            </p>
            {notification.status === 'unread' && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useProfileNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: ProfileNotification) => {
    if (notification.trade_id) {
      navigate(`/shared/trades/${notification.trade_id}`);
    } else if (notification.source_user?.username) {
      navigate(`/community/trader/${notification.source_user.username}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Mobile backdrop */}
      <div className="lg:hidden fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl
        lg:relative lg:w-96 lg:max-w-none
        transform transition-transform duration-300 ease-in-out z-10
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">You'll see likes, follows, and comments here</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
