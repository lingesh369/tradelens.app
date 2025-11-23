
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
];

const REPEAT_OPTIONS = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

interface NotificationSchedulerProps {
  scheduledFor: string;
  timezone: string;
  repeatType: string;
  onChange: (data: { scheduled_for?: string; timezone?: string; repeat_type?: string }) => void;
}

export const NotificationScheduler: React.FC<NotificationSchedulerProps> = ({
  scheduledFor,
  timezone,
  repeatType,
  onChange
}) => {
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16); // 5 minutes from now

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4" />
        Schedule Settings
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduled_for" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Date & Time *
          </Label>
          <Input
            id="scheduled_for"
            type="datetime-local"
            value={scheduledFor}
            min={minDateTime}
            onChange={(e) => onChange({ scheduled_for: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimum 5 minutes from now
          </p>
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={timezone}
            onValueChange={(value) => onChange({ timezone: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="repeat_type">Repeat</Label>
          <Select
            value={repeatType}
            onValueChange={(value) => onChange({ repeat_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select repeat option" />
            </SelectTrigger>
            <SelectContent>
              {REPEAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {scheduledFor && (
        <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
          <strong>Scheduled for:</strong> {new Date(scheduledFor).toLocaleString()} ({timezone})
          {repeatType !== 'once' && (
            <div><strong>Repeats:</strong> {repeatType}</div>
          )}
        </div>
      )}
    </div>
  );
};
