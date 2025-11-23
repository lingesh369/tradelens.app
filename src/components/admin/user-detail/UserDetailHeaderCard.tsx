
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, ShieldOff, Mail, StickyNote, LogOut, Calendar, MapPin, Clock, User, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-1" />
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export const UserDetailHeaderCard = ({ userDetails, isProcessing, handleBanUser }: any) => {
  if (!userDetails) return null;

  const fullName = [userDetails.first_name, userDetails.last_name].filter(Boolean).join(' ') || userDetails.username;
  const statusIcon = userDetails.user_status === 'Active' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-2xl">{fullName}</CardTitle>
          <CardDescription>@{userDetails.username} &middot; {userDetails.email}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled><Edit className="mr-2 h-4 w-4" /> Reset Password</DropdownMenuItem>
            <DropdownMenuItem onClick={handleBanUser} disabled={isProcessing}>
              <ShieldOff className="mr-2 h-4 w-4" /> {userDetails.user_status === 'Active' ? 'Suspend' : 'Un-suspend'} User
            </DropdownMenuItem>
            <DropdownMenuItem disabled><Mail className="mr-2 h-4 w-4" /> Send Notification</DropdownMenuItem>
            <DropdownMenuItem disabled><StickyNote className="mr-2 h-4 w-4" /> Add Internal Note</DropdownMenuItem>
            <DropdownMenuItem disabled><LogOut className="mr-2 h-4 w-4" /> Force Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="border-t pt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-4 gap-x-2 text-sm">
        <InfoItem icon={Calendar} label="Signup Date" value={format(new Date(userDetails.signup_date!), 'MMM d, yyyy')} />
        <InfoItem icon={MapPin} label="Location" value={userDetails.location} />
        <InfoItem icon={Clock} label="Timezone" value={userDetails.timezone} />
        <div className="flex items-center gap-2">
            {statusIcon}
            <Badge variant={userDetails.user_status === 'Active' ? 'default' : 'destructive'}>{userDetails.user_status}</Badge>
        </div>
        <div className="flex items-center gap-2"><Badge variant="secondary">{userDetails.user_role}</Badge></div>
        <div className="col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-2">
            <p className="text-sm">Plan: <strong>{userDetails.subscription_plan}</strong> ({userDetails.days_left} days left)</p>
        </div>
      </CardContent>
    </Card>
  );
};
