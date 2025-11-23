
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

// Simplified version without relying on the subscription_history table
export function SubscriptionHistoryTable() {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <p>Subscription history has been reset with the new subscription system.</p>
    </div>
  );
}
