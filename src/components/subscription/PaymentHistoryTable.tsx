
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function PaymentHistoryTable() {
  const { paymentHistory, isLoadingPayments } = useSubscription();

  if (isLoadingPayments) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (paymentHistory.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No payment history yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Plan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paymentHistory.map((payment) => (
          <TableRow key={payment.payment_id}>
            <TableCell>
              {format(new Date(payment.payment_date), "PP")}
            </TableCell>
            <TableCell>
              ${payment.amount.toFixed(2)} {payment.currency}
            </TableCell>
            <TableCell>{payment.payment_method || "N/A"}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === "succeeded" ? "bg-green-100 text-green-800" :
                  payment.status === "failed" ? "bg-red-100 text-red-800" :
                  payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-blue-100 text-blue-800"
                }`}
              >
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              {payment.subscription_plan || "N/A"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
