
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NotificationToastProps {
  title: string;
  message: string;
  link?: string;
  action_type?: string;
  onDismiss?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  message,
  link,
  action_type,
  onDismiss
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (link) {
      navigate(link);
    }
    onDismiss?.();
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg max-w-sm">
      <div className="flex-shrink-0">
        <Bell className="h-5 w-5 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-1">{title}</div>
        <div className="text-sm text-muted-foreground mb-3">{message}</div>
        
        <div className="flex items-center gap-2">
          {link && action_type && (
            <Button
              size="sm"
              onClick={handleAction}
              className="text-xs px-3 py-1"
            >
              {action_type}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs px-2 py-1"
          >
            Dismiss
          </Button>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 h-6 w-6"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Helper function to show notification toast
export const showNotificationToast = (notification: {
  title: string;
  message: string;
  link?: string;
  action_type?: string;
}) => {
  toast.custom((t) => (
    <NotificationToast
      {...notification}
      onDismiss={() => toast.dismiss(t)}
    />
  ), {
    duration: 6000,
  });
};
