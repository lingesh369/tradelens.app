import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { ChangePlanModal } from './ChangePlanModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updateSubscriptionExpiry, updatePaymentStatus } from '@/lib/admin-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 border-b">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right">{value}</p>
    </div>
);

export const UserSubscriptionTab = ({ userDetails, payments, isLoadingPayments, onSubscriptionUpdate }: any) => {
    const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
    const [isEditingExpiry, setIsEditingExpiry] = useState(false);
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { toast } = useToast();

    if (!userDetails) return null;

    const handleEditExpiryClick = () => {
        setNewExpiryDate(userDetails.end_date ? format(new Date(userDetails.end_date), 'yyyy-MM-dd') : '');
        setIsEditingExpiry(true);
    };

    const handleCancelEdit = () => {
        setIsEditingExpiry(false);
        setNewExpiryDate('');
    };

    const handleSaveExpiry = async () => {
        if (!newExpiryDate) {
            toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        const date = new Date(`${newExpiryDate}T00:00:00`);
        const result = await updateSubscriptionExpiry(userDetails.user_id, date);
        if (result.success) {
            toast({ title: "Success", description: "Subscription expiry date updated." });
            onSubscriptionUpdate();
            setIsEditingExpiry(false);
        } else {
            toast({ title: "Error", description: result.error || "Failed to update expiry date.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const getPaymentIdentifier = (payment: any) => {
        const method = payment.payment_method?.toLowerCase();
        if (method?.includes('upi') || method?.includes('phonepe')) {
            return payment.order_number || payment.transaction_id || payment.payment_id || 'N/A';
        }
        if (method === 'crypto' || method === 'paypal') {
            return payment.invoice_id || payment.transaction_id || payment.payment_id || 'N/A';
        }
        return payment.transaction_id || payment.invoice_id || payment.order_number || payment.payment_id || 'N/A';
    };

    const handleStatusChange = async (paymentId: string, newStatus: string) => {
        setUpdatingStatusId(paymentId);
        const dbStatus = newStatus.toLowerCase() === 'successful' ? 'succeeded' : newStatus.toLowerCase();
        const result = await updatePaymentStatus(paymentId, dbStatus);

        if (result.success) {
            toast({ title: "Success", description: "Payment status updated." });
            onSubscriptionUpdate();
        } else {
            toast({ title: "Error", description: result.error || "Failed to update payment status.", variant: "destructive" });
        }
        setUpdatingStatusId(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Subscription & Billing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <div>
                            <DetailItem label="Current Plan" value={userDetails.subscription_plan} />
                            <DetailItem label="Subscription ID" value={userDetails.subscription_id || 'N/A'} />
                            <DetailItem label="Payment Method" value={userDetails.payment_method || 'N/A'} />
                        </div>
                        <div>
                            <DetailItem label="Next Billing Date" value={userDetails.next_billing_date ? format(new Date(userDetails.next_billing_date), 'MMM d, yyyy') : 'N/A'} />
                            <DetailItem label="Trial Period" value={userDetails.end_date ? `Ends on ${format(new Date(userDetails.end_date), 'MMM d, yyyy')}` : 'N/A'} />
                            <DetailItem label="Subscription End Date" value={userDetails.end_date ? format(new Date(userDetails.end_date), 'MMM d, yyyy') : 'N/A'} />
                        </div>
                    </div>
                     <div className="flex flex-col items-end gap-4 mt-4">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleEditExpiryClick} disabled={isEditingExpiry}>Edit Expiry Date</Button>
                            <Button variant="outline" onClick={() => setIsChangePlanModalOpen(true)} disabled={isEditingExpiry}>Change Plan</Button>
                        </div>
                        {isEditingExpiry && (
                            <div className="w-full max-w-sm space-y-2 p-4 border rounded-md">
                                <Label htmlFor="expiry-date-input" className="font-semibold">Set New Expiry Date</Label>
                                <Input
                                    id="expiry-date-input"
                                    type="date"
                                    value={newExpiryDate}
                                    onChange={(e) => setNewExpiryDate(e.target.value)}
                                    className="w-full"
                                />
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                                    <Button onClick={handleSaveExpiry} disabled={isSaving || !newExpiryDate}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Billing History</h4>
                        {isLoadingPayments ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : (payments && payments.length > 0) ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Order Id/Invoice Id</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment: any) => {
                                        const dbStatus = (payment.payment_status || 'pending').toLowerCase();
                                        const displayStatus = dbStatus === 'succeeded' 
                                            ? 'Successful' 
                                            : dbStatus.charAt(0).toUpperCase() + dbStatus.slice(1);
                                        return (
                                        <TableRow key={payment.payment_id}>
                                            <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy, p')}</TableCell>
                                            <TableCell>{payment.subscription_plan || 'N/A'}</TableCell>
                                            <TableCell>{payment.currency} {payment.amount}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={displayStatus}
                                                    onValueChange={(value) => handleStatusChange(payment.payment_id, value)}
                                                    disabled={updatingStatusId === payment.payment_id}
                                                >
                                                    <SelectTrigger className="w-[130px]">
                                                        {updatingStatusId === payment.payment_id 
                                                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                                            : <SelectValue placeholder="Set status" />
                                                        }
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="Successful">Successful</SelectItem>
                                                        <SelectItem value="Failed">Failed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>{payment.payment_method?.replace("_", " ") || 'N/A'}</TableCell>
                                            <TableCell className="font-mono">{getPaymentIdentifier(payment)}</TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        ) : (
                            <CardDescription>No billing history found.</CardDescription>
                        )}
                    </div>
                </CardContent>
            </Card>
            <ChangePlanModal
                open={isChangePlanModalOpen}
                onOpenChange={setIsChangePlanModalOpen}
                userDetails={userDetails}
                onSubscriptionUpdate={() => {
                    onSubscriptionUpdate();
                    setIsChangePlanModalOpen(false);
                }}
            />
        </>
    );
};
