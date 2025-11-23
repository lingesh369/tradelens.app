
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserIcon } from 'lucide-react';

interface UserDetails {
  user_id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  user_role: string;
  user_status: string;
}

interface UserBasicInfoProps {
  userDetails: UserDetails;
}

const UserBasicInfo = ({ userDetails }: UserBasicInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserIcon className="mr-2 h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">User ID</p>
          <p className="text-sm text-muted-foreground break-all">{userDetails.user_id}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm">{userDetails.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Username</p>
          <p className="text-sm">{userDetails.username || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Name</p>
          <p className="text-sm">
            {userDetails.first_name || userDetails.last_name
              ? `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim()
              : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Role</p>
          <Badge 
            variant={
              userDetails.user_role === 'Admin'
                ? 'default'
                : userDetails.user_role === 'Manager'
                  ? 'secondary'
                  : 'outline'
            }
            className="mt-1"
          >
            {userDetails.user_role}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <Badge 
            variant={userDetails.user_status === 'Active' ? "outline" : "destructive"}
            className="mt-1"
          >
            {userDetails.user_status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBasicInfo;
