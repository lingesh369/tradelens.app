
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { useStrategies } from '@/hooks/useStrategies';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { performTradeAnalysis } from '@/services/tradeAnalysis/analysisService';
import { getErrorMessage, getToastDescription } from '@/services/tradeAnalysis/errorHandlers';
import { TradeAnalysisResult } from '@/services/tradeAnalysis/types';

export type { TradeAnalysisResult } from '@/services/tradeAnalysis/types';

export const useTradeAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TradeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const { strategies } = useStrategies();
  const { settings } = useGlobalSettings();

  const analyzeTrades = async (selectedTradeIds: string[], dateRange: { from: Date; to: Date }) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Get user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: appUser } = await supabase
        .from('app_users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (!appUser) throw new Error('User profile not found');

      // Perform the analysis using the service
      const result = await performTradeAnalysis({
        selectedTradeIds,
        dateRange,
        appUserId: appUser.user_id,
        accounts,
        strategies,
        settings
      });

      setAnalysisResult(result);

    } catch (error) {
      console.error('Trade analysis error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      
      const toastDescription = getToastDescription(errorMessage);
      
      toast({
        title: "Analysis Error",
        description: toastDescription,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeTrades,
    clearAnalysis,
  };
};
