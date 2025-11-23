
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditCard, NotebookText, BarChart2, LineChart } from 'lucide-react';

interface UserStats {
  accounts_count?: number;
  notes_count?: number;
  strategies_count?: number;
  trades_count?: number;
  trial_days_remaining?: number;
}

interface UserDetails {
  notes: string | null;
}

interface UserStatisticsProps {
  userStats: UserStats | null;
  userDetails: UserDetails;
}

const UserStatistics = ({ userStats, userDetails }: UserStatisticsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart2 className="mr-2 h-5 w-5" />
          Usage Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Trading Accounts</p>
          <p className="text-sm">{userStats?.accounts_count || 0}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Notes</p>
          <p className="text-sm">{userStats?.notes_count || 0}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Strategies</p>
          <p className="text-sm">{userStats?.strategies_count || 0}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Trades</p>
          <p className="text-sm">{userStats?.trades_count || 0}</p>
        </div>
        
        {userStats?.trial_days_remaining !== undefined && userStats?.trial_days_remaining > 0 && (
          <div>
            <p className="text-sm font-medium">Trial Days Remaining</p>
            <p className="text-sm">{userStats.trial_days_remaining}</p>
          </div>
        )}
        
        {userDetails.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-1">Admin Notes</p>
            <p className="text-sm italic">{userDetails.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserStatistics;
