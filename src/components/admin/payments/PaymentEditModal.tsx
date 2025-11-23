
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PaymentEditModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentEditModal: React.FC<PaymentEditModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState(payment.payment_status);
  const [adminNotes, setAdminNotes] = useState(payment.admin_notes || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, newStatus, notes }: { paymentId: string; newStatus: string; notes: string }) => {
      // Update status
      const { error: statusError } = await supabase.rpc('update_payment_status', {
        payment_id_param: paymentId,
        status_param: newStatus
      });
      
      if (statusError) throw statusError;

      // Update admin notes
      const { error: notesError } = await supabase.rpc('update_payment_admin_notes', {
        payment_id_param: paymentId,
        notes_param: notes
      });

      if (notesError) throw notesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-metrics'] });
      toast({
        title: "Payment Updated",
        description: "Payment details have been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update payment details. Please try again.",
        variant: "destructive",
      });
      console.error('Payment update error:', error);
    },
  });

  const handleSave = () => {
    updatePaymentMutation.mutate({
      paymentId: payment.payment_id,
      newStatus: status,
      notes: adminNotes,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment status and admin notes for Order #{payment.order_number || payment.invoice_id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Payment Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this payment..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updatePaymentMutation.isPending}
          >
            {updatePaymentMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
