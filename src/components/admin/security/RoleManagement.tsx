
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { AdminSecurityService, RoleChangeRequest } from '@/services/adminSecurityService';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleManagementProps {
  userId: string;
  currentRole: string;
  username: string;
  onRoleChanged?: () => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  userId,
  currentRole,
  username,
  onRoleChanged
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'User' | 'Admin' | 'Manager'>('User');
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const roleUpdateMutation = useMutation({
    mutationFn: async (request: RoleChangeRequest) => {
      return AdminSecurityService.updateUserRole(request);
    },
    onSuccess: (data) => {
      toast({
        title: "Role Updated Successfully",
        description: `${username}'s role has been changed from ${data.old_role} to ${data.new_role}`,
      });
      queryClient.invalidateQueries({ queryKey: ['adminAllUsersEnhanced'] });
      onRoleChanged?.();
      setIsDialogOpen(false);
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        title: "Role Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleRoleChange = () => {
    if (!selectedRole || selectedRole === currentRole) {
      toast({
        title: "No Change Required",
        description: "The selected role is the same as the current role.",
        variant: "default",
      });
      return;
    }

    roleUpdateMutation.mutate({
      targetUserId: userId,
      newRole: selectedRole,
      reason: reason.trim() || undefined
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-red-600 dark:text-red-400';
      case 'Manager': return 'text-orange-600 dark:text-orange-400';
      case 'User': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedRole(currentRole as 'User' | 'Admin' | 'Manager');
          setIsDialogOpen(true);
        }}
        className="gap-2"
      >
        <Shield className="h-4 w-4" />
        Change Role
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Change User Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change <strong>{username}</strong>'s role.
              Current role: <span className={getRoleColor(currentRole)}>{currentRole}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">New Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value: 'User' | 'Admin' | 'Manager') => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this role change is necessary..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">⚠️ Security Notice:</p>
              <p>This action will be logged for audit purposes. Role changes cannot be undone automatically.</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={roleUpdateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={roleUpdateMutation.isPending || !selectedRole}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {roleUpdateMutation.isPending ? 'Updating...' : 'Update Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
