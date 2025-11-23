
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserDetails {
  user_id: string;
  email: string;
  user_status: string;
}

interface UserDetailHeaderProps {
  userDetails: UserDetails;
  navigate: (path: string) => void;
  handleBanUser: () => Promise<void>;
  isProcessing: boolean;
}

const UserDetailHeader = ({ userDetails, navigate, handleBanUser, isProcessing }: UserDetailHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/users')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
        <p className="text-muted-foreground">
          Manage {userDetails.email}'s account
        </p>
      </div>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant={userDetails.user_status === 'Banned' ? "outline" : "destructive"}
            className="flex items-center"
            disabled={isProcessing}
          >
            {userDetails.user_status === 'Banned' ? (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Unban User
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Ban User
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userDetails.user_status === 'Banned' ? 'Unban User' : 'Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userDetails.user_status === 'Banned'
                ? "This will restore the user's access to the platform."
                : "This will prevent the user from accessing the platform until unbanned."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBanUser}
              className={userDetails.user_status === 'Banned' ? undefined : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {userDetails.user_status === 'Banned' ? 'Unban' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDetailHeader;
