import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface Payment {
  payment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  payment_status: string;
  currency: string;
  description: string | null;
  subscription_plan?: string;  // Added to match our database structure
}

interface UserPaymentHistoryProps {
  payments: Payment[];
  isLoadingPayments: boolean;
  openAddPaymentDialog: boolean;
  setOpenAddPaymentDialog: (open: boolean) => void;
  newPayment: {
    plan: string;
    amount: string;
    paymentMethod: string;
    billingCycle: string;
    transactionId: string;
    notes: string;
    paymentDate: string;
  };
  setNewPayment: (data: any) => void;
  isProcessing: boolean;
  handleAddPayment: () => Promise<void>;
  formatDate: (date: string | null) => string;
}

const UserPaymentHistory = ({ 
  payments,
  isLoadingPayments,
  openAddPaymentDialog,
  setOpenAddPaymentDialog,
  newPayment,
  setNewPayment,
  isProcessing,
  handleAddPayment,
  formatDate
}: UserPaymentHistoryProps) => {
  return (
    <Tabs defaultValue="payment-history">
      <TabsList>
        <TabsTrigger value="payment-history">Payment History</TabsTrigger>
        <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
      </TabsList>
      
      <TabsContent value="payment-history" className="py-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Payment History</h3>
          
          <Dialog open={openAddPaymentDialog} onOpenChange={setOpenAddPaymentDialog}>
            <DialogTrigger asChild>
              <Button>Add Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Payment</DialogTitle>
                <DialogDescription>
                  Record a manual payment for this user.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select 
                    value={newPayment.plan} 
                    onValueChange={(value) => setNewPayment({...newPayment, plan: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select 
                    value={newPayment.billingCycle} 
                    onValueChange={(value) => setNewPayment({...newPayment, billingCycle: value})}
                  >
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
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={newPayment.amount} 
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select 
                    value={newPayment.paymentMethod} 
                    onValueChange={(value) => setNewPayment({...newPayment, paymentMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="phonepe">PhonePe</SelectItem>
                      <SelectItem value="nowpayments">Now Payments</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input 
                    id="payment-date" 
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({...newPayment, paymentDate: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                  <Input 
                    id="transaction-id" 
                    value={newPayment.transactionId} 
                    onChange={(e) => setNewPayment({...newPayment, transactionId: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input 
                    id="notes" 
                    value={newPayment.notes} 
                    onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setOpenAddPaymentDialog(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPayment}
                  disabled={isProcessing || parseFloat(newPayment.amount) <= 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Payment'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingPayments ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment history found for this user.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.payment_id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {payment.subscription_plan || 
                       payment.description?.includes('Pro') ? 'Pro' : 
                       payment.description?.includes('pro') ? 'Pro' :
                       payment.description?.includes('Starter') ? 'Starter' :
                       payment.description?.includes('starter') ? 'Starter' : 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.currency} {payment.amount}</TableCell>
                  <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}>
                      {payment.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.description || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
      
      <TabsContent value="activity-log" className="py-4">
        <div className="text-center py-8 text-muted-foreground">
          Activity log feature coming soon.
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default UserPaymentHistory;
