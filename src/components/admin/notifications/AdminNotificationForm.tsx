
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { UserSelector } from './UserSelector';

const NOTIFICATION_TYPES = [
  { value: 'platform_update', label: 'Platform Update' },
  { value: 'payment_alert', label: 'Payment Alert' },
  { value: 'account_activity', label: 'Account Activity' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'custom', label: 'Custom' }
];

export const AdminNotificationForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: '',
    action_type: '',
    type: 'custom',
    target_type: 'all',
    user_ids: [] as string[],
    send_push: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [targetMode, setTargetMode] = useState<'broadcast' | 'individual'>('broadcast');
  const { toast } = useToast();

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

    if (targetMode === 'individual' && formData.user_ids.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user for individual targeting.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          ...formData,
          target_type: targetMode === 'broadcast' ? 'all' : 'selected'
        }
      });

      if (error) throw error;

      toast({
        title: 'Notification sent!',
        description: data.message || 'Notification sent successfully.'
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        link: '',
        action_type: '',
        type: 'custom',
        target_type: 'all',
        user_ids: [],
        send_push: true
      });
      setTargetMode('broadcast');

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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Selection */}
            <div className="space-y-4">
              <Label>Target Audience</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="broadcast"
                    name="targetMode"
                    checked={targetMode === 'broadcast'}
                    onChange={() => setTargetMode('broadcast')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="broadcast">Broadcast to All Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="individual"
                    name="targetMode"
                    checked={targetMode === 'individual'}
                    onChange={() => setTargetMode('individual')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="individual">Select Individual Users</Label>
                </div>
              </div>
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

            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title"
                required
              />
            </div>

            {/* Message */}
            <div>
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

            {/* Link (Optional) */}
            <div>
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="/dashboard, /trades, etc."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Relative route on platform (e.g., /dashboard, /trades)
              </p>
            </div>

            {/* Action Type (Optional) */}
            <div>
              <Label htmlFor="action_type">Action Button Label (Optional)</Label>
              <Input
                id="action_type"
                value={formData.action_type}
                onChange={(e) => setFormData(prev => ({ ...prev, action_type: e.target.value }))}
                placeholder="View Trade, Check Account, etc."
              />
            </div>

            {/* Send Push Notification */}
            <div className="flex items-center space-x-2">
              <Switch
                id="send_push"
                checked={formData.send_push}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_push: checked }))}
              />
              <Label htmlFor="send_push">Send browser push notification</Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Notification...
                </>
              ) : (
                'Send Notification'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Individual User Selector */}
      {targetMode === 'individual' && (
        <UserSelector
          selectedUsers={formData.user_ids}
          onSelectionChange={handleUserSelectionChange}
        />
      )}
    </div>
  );
};
