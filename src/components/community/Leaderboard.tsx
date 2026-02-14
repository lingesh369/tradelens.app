import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardCard } from './LeaderboardCard';
import { useLeaderboard } from '@/hooks/useCommunity';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Leaderboard: React.FC = () => {
  const { data: leaderboardData, isLoading, error } = useLeaderboard();

  if (error) {
    return (
      <Alert className="mb-6">
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          Unable to load leaderboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Top Performers</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ranked by trading performance and consistency
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-80">
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : leaderboardData && leaderboardData.length > 0 ? (
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {leaderboardData.map((trader) => (
              <LeaderboardCard
                key={trader.user_id}
                trader={trader}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No leaderboard data available yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Start trading and sharing to see rankings!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
