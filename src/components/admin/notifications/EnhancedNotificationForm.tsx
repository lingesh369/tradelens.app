
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users, Send, Eye } from 'lucide-react';
import { NotificationPreview } from './NotificationPreview';
import { NotificationScheduler } from './NotificationScheduler';
import { UserSelector } from './UserSelector';

const NOTIFICATION_TYPES = [
  { value: 'platform_update', label: 'Platform Update' },
  { value: 'payment_alert', label: 'Payment Alert' },
  { value: 'account_activity', label: 'Account Activity' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'custom', label: 'Custom' }
];

interface UserSegment {
  count: number;
  description: string;
}

interface UserSegments {
  all_users: UserSegment;
  new_signups_7d: UserSegment;
  new_signups_30d: UserSegment;
  free_trial_users: UserSegment;
  pro_plan_users: UserSegment;
  starter_plan_users: UserSegment;
  trial_period_users: UserSegment;
}

export const EnhancedNotificationForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: '',
    action_type: '',
    type: 'custom',
    target_type: 'all_users',
    user_ids: [] as string[],
    send_in_app: true,
    send_email: false,
    send_push: true,
    is_scheduled: false,
    scheduled_for: '',
    timezone: 'UTC',
    repeat_type: 'once'
  });

  const [userSegments, setUserSegments] = useState<UserSegments | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [targetMode, setTargetMode] = useState<'segment' | 'custom'>('segment');
  const { toast } = useToast();

  useEffect(() => {
    fetchUserSegments();
  }, []);

  const fetchUserSegments = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_segments');
      if (error) throw error;
      
      // Properly cast the Json response to UserSegments
      setUserSegments(data as unknown as UserSegments);
    } catch (error: any) {
      console.error('Error fetching user segments:', error);
      toast({
        title: 'Error fetching user segments',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getTargetUserCount = () => {
    if (targetMode === 'custom') {
      return formData.user_ids.length;
    }
    if (!userSegments) return 0;
    return userSegments[formData.target_type as keyof UserSegments]?.count || 0;
  };

  const getTargetDescription = () => {
    if (targetMode === 'custom') {
      return `Custom selected users`;
    }
    if (!userSegments) return '';
    return userSegments[formData.target_type as keyof UserSegments]?.description || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast({
        title: 'Missing fields',
        description: 'Title and message are required.',
        variant: 'destructive'
      });
      return;
    }

    const targetCount = getTargetUserCount();
    if (targetCount === 0) {
      toast({
        title: 'No target users',
        description: 'Please select at least one user or user segment.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const notificationData = {
        title: formData.title,
        message: formData.message,
        link: formData.link || null,
        action_type: formData.action_type || null,
        type: formData.type,
        target_type: targetMode === 'custom' ? 'selected' : formData.target_type,
        user_ids: targetMode === 'custom' ? formData.user_ids : undefined,
        send_in_app: formData.send_in_app,
        send_email: formData.send_email,
        send_push: formData.send_push
      };

      if (formData.is_scheduled && formData.scheduled_for) {
        // Create scheduled notification
        const { error } = await supabase
          .from('scheduled_notifications')
          .insert({
            notification_data: notificationData,
            scheduled_for: formData.scheduled_for,
            timezone: formData.timezone,
            repeat_type: formData.repeat_type,
            target_type: targetMode === 'custom' ? 'selected' : formData.target_type,
            status: 'scheduled'
          });

        if (error) throw error;

        toast({
          title: 'Notification scheduled!',
          description: `Notification scheduled for ${new Date(formData.scheduled_for).toLocaleString()}`
        });
      } else {
        // Send immediate notification
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: notificationData
        });

        if (error) throw error;

        toast({
          title: 'Notification sent!',
          description: `Sent to ${targetCount} users successfully.`
        });
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        link: '',
        action_type: '',
        type: 'custom',
        target_type: 'all_users',
        user_ids: [],
        send_in_app: true,
        send_email: false,
        send_push: true,
        is_scheduled: false,
        scheduled_for: '',
        timezone: 'UTC',
        repeat_type: 'once'
      });
      setTargetMode('segment');

    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Failed to send notification',
        description: error.message || 'An error occurred while sending the notification.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelectionChange = (userIds: string[]) => {
    setFormData(prev => ({ ...prev, user_ids: userIds }));
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enhanced Notification Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Audience Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </Label>
              
              {/* Target Mode Selection */}
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="segment"
                    name="targetMode"
                    checked={targetMode === 'segment'}
                    onChange={() => setTargetMode('segment')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="segment">User Segments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom"
                    name="targetMode"
                    checked={targetMode === 'custom'}
                    onChange={() => setTargetMode('custom')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="custom">Custom Users</Label>
                </div>
              </div>

              {targetMode === 'segment' ? (
                <Select
                  value={formData.target_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">
                      All Users ({userSegments?.all_users?.count || 0})
                    </SelectItem>
                    <SelectItem value="new_signups_7d">
                      New Signups (7 days) ({userSegments?.new_signups_7d?.count || 0})
                    </SelectItem>
                    <SelectItem value="new_signups_30d">
                      New Signups (30 days) ({userSegments?.new_signups_30d?.count || 0})
                    </SelectItem>
                    <SelectItem value="free_trial_users">
                      Free Trial Users ({userSegments?.free_trial_users?.count || 0})
                    </SelectItem>
                    <SelectItem value="starter_plan_users">
                      Starter Plan Users ({userSegments?.starter_plan_users?.count || 0})
                    </SelectItem>
                    <SelectItem value="pro_plan_users">
                      Pro Plan Users ({userSegments?.pro_plan_users?.count || 0})
                    </SelectItem>
                    <SelectItem value="trial_period_users">
                      Trial Period Users ({userSegments?.trial_period_users?.count || 0})
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <UserSelector
                  selectedUsers={formData.user_ids}
                  onSelectionChange={handleUserSelectionChange}
                />
              )}

              {(targetMode === 'segment' ? userSegments : true) && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <strong>Target:</strong> {getTargetDescription()} ({getTargetUserCount()} users)
                </div>
              )}
            </div>

            {/* Notification Type */}
            <div>
              <Label htmlFor="type">Notification Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="link">Link (Optional)</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com or /dashboard"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter full URL (https://...) for external links or relative path (/dashboard) for internal pages
                </p>
              </div>

              <div>
                <Label htmlFor="action_type">Action Button Label (Optional)</Label>
                <Input
                  id="action_type"
                  value={formData.action_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, action_type: e.target.value }))}
                  placeholder="View Details, Learn More, etc."
                />
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Delivery Channels</Label>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send_in_app"
                    checked={formData.send_in_app}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_in_app: checked }))}
                  />
                  <Label htmlFor="send_in_app">In-App Notification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send_email"
                    checked={formData.send_email}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_email: checked }))}
                  />
                  <Label htmlFor="send_email">Email Notification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send_push"
                    checked={formData.send_push}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_push: checked }))}
                  />
                  <Label htmlFor="send_push">Push Notification</Label>
                </div>
              </div>
            </div>

            {/* Scheduling Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_scheduled"
                  checked={formData.is_scheduled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_scheduled: checked }))}
                />
                <Label htmlFor="is_scheduled" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule for later
                </Label>
              </div>

              {formData.is_scheduled && (
                <NotificationScheduler
                  scheduledFor={formData.scheduled_for}
                  timezone={formData.timezone}
                  repeatType={formData.repeat_type}
                  onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>

              <Button 
                type="submit" 
                disabled={isLoading || getTargetUserCount() === 0}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {formData.is_scheduled ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {formData.is_scheduled ? <Calendar className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {formData.is_scheduled ? 'Schedule Notification' : 'Send Now'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <NotificationPreview
          notification={formData}
          targetCount={getTargetUserCount()}
          targetDescription={getTargetDescription()}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
