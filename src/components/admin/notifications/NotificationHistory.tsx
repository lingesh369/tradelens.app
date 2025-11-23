
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { History, Clock, Users, Eye, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledNotification {
  id: string;
  notification_data: any;
  scheduled_for: string;
  timezone: string;
  repeat_type: string;
  status: string;
  target_type: string;
  created_at: string;
  updated_at: string;
}

export const NotificationHistory = () => {
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [scheduledNotifications, filterStatus, searchTerm]);

  const fetchScheduledNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching scheduled notifications:', error);
      toast({
        title: 'Error fetching notifications',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = scheduledNotifications;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.notification_data?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.notification_data?.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleCancelNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Notification cancelled',
        description: 'The scheduled notification has been cancelled.'
      });

      fetchScheduledNotifications();
    } catch (error: any) {
      console.error('Error cancelling notification:', error);
      toast({
        title: 'Error cancelling notification',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    const labels: Record<string, string> = {
      'all_users': 'All Users',
      'new_signups_7d': 'New Signups (7d)',
      'new_signups_30d': 'New Signups (30d)',
      'free_trial_users': 'Free Trial Users',
      'pro_plan_users': 'Pro Plan Users',
      'starter_plan_users': 'Starter Plan Users',
      'trial_period_users': 'Trial Period Users',
    };
    return labels[targetType] || targetType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Notification History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">
                          {notification.notification_data?.title || 'Untitled'}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(notification.status)}`}
                        >
                          {notification.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.notification_data?.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {getTargetTypeLabel(notification.target_type)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(notification.scheduled_for), 'MMM d, yyyy HH:mm')}
                        </div>
                        {notification.repeat_type !== 'once' && (
                          <Badge variant="outline" className="text-xs">
                            {notification.repeat_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {notification.status === 'scheduled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelNotification(notification.id)}
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
