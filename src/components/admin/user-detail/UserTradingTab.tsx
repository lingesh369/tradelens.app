
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right">{value}</p>
    </div>
);

export const UserTradingTab = ({ stats, isLoading }: any) => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>
    }

    if (!stats) return <p>Could not load trading stats.</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trading Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <DetailItem label="Net P&L" value={stats.net_pnl} />
                    <DetailItem label="Win Rate" value={stats.win_rate} />
                    <DetailItem label="Trades Logged" value={stats.trades_count} />
                  </div>
                  <div>
                    <DetailItem label="Last Trade Logged" value={stats.last_trade_logged} />
                    <DetailItem label="Active Accounts Linked" value={stats.accounts_count} />
                    <DetailItem label="Strategy Count" value={stats.strategies_count} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" disabled>View Full Journal</Button>
                    <Button variant="outline" disabled>View Trades Breakdown</Button>
                    <Button disabled>Export User's Trading Data (.csv)</Button>
                </div>
            </CardContent>
        </Card>
    );
};
