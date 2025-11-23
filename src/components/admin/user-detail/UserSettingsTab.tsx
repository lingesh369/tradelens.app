
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right">{value}</p>
    </div>
);

export const UserSettingsTab = ({ settings, isLoading }: { settings: any, isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (!settings) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Could not load user settings.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <DetailItem label="Preferred Currency" value={settings.base_currency} />
                <DetailItem label="Chart Timezone" value={settings.time_zone} />
                <DetailItem label="Dark Mode" value={settings.dark_mode ? 'Enabled' : 'Disabled'} />
            </CardContent>
        </Card>
    );
};
