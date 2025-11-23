
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, RotateCw, FileEdit, Mail, UserCog } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserDetails {
  user_id: string;
  email: string;
  user_role: string;
  // Add other properties as needed
}

interface UserAdminActionsProps {
  userDetails: UserDetails;
  editUserData: {
    first_name: string;
    last_name: string;
    username: string;
    notes: string;
  };
  selectedPlan: string;
  selectedBillingCycle: string;
  calculatedExpiryDate: Date | null;
  trialDaysToExtend: string;
  emailData: {
    subject: string;
    message: string;
  };
  newPayment: {
    plan: string;
    amount: string;
    paymentMethod: string;
    billingCycle: string;
    transactionId: string;
    notes: string;
    paymentDate: string;
  };
  selectedRole: string;
  isProcessing: boolean;
  openChangePlanDialog: boolean;
  openExtendTrialDialog: boolean;
  openResetTrialDialog: boolean;
  openEditUserDialog: boolean;
  openSendEmailDialog: boolean;
  openAddPaymentDialog: boolean;
  openChangeRoleDialog: boolean;
  setOpenChangePlanDialog: (open: boolean) => void;
  setOpenExtendTrialDialog: (open: boolean) => void;
  setOpenResetTrialDialog: (open: boolean) => void;
  setOpenEditUserDialog: (open: boolean) => void;
  setOpenSendEmailDialog: (open: boolean) => void;
  setOpenAddPaymentDialog: (open: boolean) => void;
  setOpenChangeRoleDialog: (open: boolean) => void;
  setSelectedPlan: (plan: string) => void;
  setSelectedBillingCycle: (cycle: string) => void;
  setTrialDaysToExtend: (days: string) => void;
  setEditUserData: (data: any) => void;
  setEmailData: (data: any) => void;
  setNewPayment: (data: any) => void;
  setSelectedRole: (role: string) => void;
  formatDate: (date: string | null) => string;
  handleChangePlan: () => Promise<void>;
  handleExtendTrial: () => Promise<void>;
  handleResetTrial: () => Promise<void>;
  handleEditUser: () => Promise<void>;
  handleSendEmail: () => Promise<void>;
  handleAddPayment: () => Promise<void>;
  handleChangeRole: () => Promise<void>;
}

const UserAdminActions = ({
  userDetails,
  editUserData,
  selectedPlan,
  selectedBillingCycle,
  calculatedExpiryDate,
  trialDaysToExtend,
  emailData,
  newPayment,
  selectedRole,
  isProcessing,
  openChangePlanDialog,
  openExtendTrialDialog,
  openResetTrialDialog,
  openEditUserDialog,
  openSendEmailDialog,
  openAddPaymentDialog,
  openChangeRoleDialog,
  setOpenChangePlanDialog,
  setOpenExtendTrialDialog,
  setOpenResetTrialDialog,
  setOpenEditUserDialog,
  setOpenSendEmailDialog,
  setOpenAddPaymentDialog,
  setOpenChangeRoleDialog,
  setSelectedPlan,
  setSelectedBillingCycle,
  setTrialDaysToExtend,
  setEditUserData,
  setEmailData,
  setNewPayment,
  setSelectedRole,
  formatDate,
  handleChangePlan,
  handleExtendTrial,
  handleResetTrial,
  handleEditUser,
  handleSendEmail,
  handleAddPayment,
  handleChangeRole,
}: UserAdminActionsProps) => {
  return (
    <div className="mt-6 space-y-3">
      <Dialog open={openChangeRoleDialog} onOpenChange={setOpenChangeRoleDialog}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            <UserCog className="mr-2 h-4 w-4" />
            Change Role
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for this user. This will change their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Current Role</Label>
              <Input id="currentRole" value={userDetails.user_role} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Select New Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenChangeRoleDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangeRole}
              disabled={isProcessing || selectedRole === userDetails.user_role}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openChangePlanDialog} onOpenChange={setOpenChangePlanDialog}>
        <DialogTrigger asChild>
          <Button className="w-full">Change Plan</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free Trial">Free Trial</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Calculated Expiry Date</Label>
              <Input 
                id="expiryDate" 
                value={calculatedExpiryDate ? formatDate(calculatedExpiryDate.toISOString()) : 'N/A'} 
                disabled 
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenChangePlanDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangePlan} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Update Plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openExtendTrialDialog} onOpenChange={setOpenExtendTrialDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Extend Trial
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial Period</DialogTitle>
            <DialogDescription>
              Add more days to this user's trial period.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="days">Days to Extend</Label>
              <Select value={trialDaysToExtend} onValueChange={setTrialDaysToExtend}>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenExtendTrialDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExtendTrial}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Extend Trial'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openResetTrialDialog} onOpenChange={setOpenResetTrialDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <RotateCw className="mr-2 h-4 w-4" />
            Reset Trial
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Trial Period</DialogTitle>
            <DialogDescription>
              Reset the trial to start from today for 14 days.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              This will reset the user's trial to start today and last for 14 days, 
              regardless of their previous trial status.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenResetTrialDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetTrial}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reset Trial'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditUserDialog} onOpenChange={setOpenEditUserDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <FileEdit className="mr-2 h-4 w-4" />
            Edit User Details
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={editUserData.first_name} 
                onChange={(e) => setEditUserData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={editUserData.last_name} 
                onChange={(e) => setEditUserData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={editUserData.username} 
                onChange={(e) => setEditUserData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea 
                id="adminNotes" 
                value={editUserData.notes} 
                onChange={(e) => setEditUserData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenEditUserDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openSendEmailDialog} onOpenChange={setOpenSendEmailDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Custom Email</DialogTitle>
            <DialogDescription>
              Send a custom email to {userDetails.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input 
                id="emailSubject" 
                value={emailData.subject} 
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailMessage">Message</Label>
              <Textarea 
                id="emailMessage" 
                value={emailData.message} 
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenSendEmailDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isProcessing || !emailData.subject || !emailData.message}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserAdminActions;
