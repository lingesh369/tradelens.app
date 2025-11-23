
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right">{value}</p>
    </div>
);

export const UserActivityTab = ({ userDetails }: any) => {
    if (!userDetails) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <DetailItem label="Last Login" value={userDetails.last_login ? format(new Date(userDetails.last_login), 'MMM d, yyyy, p') : 'Never'} />
                <DetailItem label="Last IP" value="182.79.xxx.xxx (Not available)" />
                <DetailItem label="Total Logins" value="58 (Not available)" />
                <DetailItem label="Device Info" value="Chrome on Windows (Not available)" />
                <DetailItem label="Email Verified" value="✅ Yes (Not available)" />
            </CardContent>
        </Card>
    );
};
