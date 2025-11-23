
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { PaymentHistory as PaymentHistoryType } from '@/types/subscription';

const BillingHistory: React.FC = () => {
  const { paymentHistory, isLoadingPayments } = useSubscription();

  const formatPlanName = (subscriptionPlan: string | null, description: string | null, planId: string | null | undefined, billingCycle: string | null | undefined) => {
    // With standardized payment recording, subscription_plan should be reliable.
    // The description can serve as a fallback.
    return subscriptionPlan || description || 'Unknown Plan';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return '🟢';
      case 'pending':
        return '🟡';
      case 'failed':
        return '🔴';
      case 'refunded':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const getPaymentIdentifier = (payment: PaymentHistoryType) => {
    const method = payment.payment_method?.toLowerCase();
    if (method?.includes('upi') || method?.includes('phonepe')) {
      return payment.order_number || payment.transaction_id || payment.payment_id || 'N/A';
    }
    if (method === 'crypto' || method === 'paypal') {
      return payment.invoice_id || payment.transaction_id || payment.payment_id || 'N/A';
    }
    return payment.transaction_id || payment.invoice_id || payment.order_number || payment.payment_id || 'N/A';
  };

  if (isLoadingPayments) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading payment history...</span>
      </div>
    );
  }

  if (!paymentHistory || paymentHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payment history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-full overflow-x-auto">
          <Table>
            <TableCaption>Your payment and billing history</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Plan</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Amount</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground hidden sm:table-cell">Method</TableHead>
                <TableHead className="font-semibold text-muted-foreground hidden md:table-cell">Order ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.payment_id}>
                  <TableCell>
                    <div className="text-xs sm:text-sm">
                      {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {format(new Date(payment.payment_date), "p")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="max-w-[120px] sm:max-w-none truncate">
                      {formatPlanName(payment.subscription_plan || null, payment.description || null, payment.plan_id, payment.billing_cycle)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(payment.status)} className="flex items-center gap-1 w-fit text-xs">
                      <span>{getStatusIcon(payment.status)}</span>
                      <span className="capitalize">{payment.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">
                    {payment.payment_method?.replace('_', ' ') || 'Unknown'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">
                    <div className="max-w-[120px] truncate">
                      {getPaymentIdentifier(payment)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default BillingHistory;
