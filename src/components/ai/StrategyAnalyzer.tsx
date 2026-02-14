import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangeSelector, DateRange } from '@/components/filters/DateRangeSelector';
import { MultiSelectStrategies } from '@/components/ui/multi-select-strategies';
import { useStrategies } from '@/hooks/useStrategies';
import { useTrades } from '@/hooks/useTrades';
import { Loader2, Target, AlertTriangle, Brain, CheckCircle, Settings, TrendingUp, BarChart3, Filter, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnalysisSection } from '@/components/ai/AnalysisSection';
import { generateStrategyCsv, generateStrategySummary } from '@/services/ai/fileBasedAnalysis';
import { analyzeWithGPT, generateStrategyAnalysisPrompt, GPTAnalysisResponse } from '@/services/ai/gptIntegration';
export const StrategyAnalyzer: React.FC = () => {
  const {
    strategies,
    isLoading: strategiesLoading
  } = useStrategies();
  const {
    trades,
    isLoading: tradesLoading
  } = useTrades();
  const {
    toast
  } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2000, 0, 1), // Far past date for "All Time"
    to: new Date(2099, 11, 31), // Far future date for "All Time"
    preset: "allTime"
  });
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GPTAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select all strategies when they load
  useEffect(() => {
    if (strategies && strategies.length > 0 && selectedStrategies.length === 0) {
      setSelectedStrategies(strategies.map(strategy => strategy.strategy_id));
    }
  }, [strategies, selectedStrategies.length]);
  const handleAnalyze = async () => {
    if (!dateRange?.from || !dateRange?.to || selectedStrategies.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select strategies and date range",
        variant: "destructive"
      });
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      // Get selected strategies data
      const selectedStrategiesData = strategies.filter(strategy => selectedStrategies.includes(strategy.strategy_id));

      // Filter trades by selected strategies and date range
      const filteredTrades = trades.filter(trade => {
        const tradeDateTime = trade.entry_time || trade.trade_date;
        if (!tradeDateTime) return false;
        const tradeDate = new Date(tradeDateTime);
        const isInDateRange = tradeDate >= dateRange.from && tradeDate <= dateRange.to;
        const isInSelectedStrategies = selectedStrategies.includes(trade.strategy_id || '');
        return isInDateRange && isInSelectedStrategies;
      });
      if (filteredTrades.length === 0) {
        throw new Error('No trades found for the selected strategies and date range');
      }
      console.log('Analyzing strategies:', selectedStrategiesData.length, 'with trades:', filteredTrades.length);

      // Generate CSV and summary files
      const csvContent = generateStrategyCsv(filteredTrades, selectedStrategiesData);
      const summaryContent = generateStrategySummary(filteredTrades, selectedStrategiesData, {
        from: dateRange.from,
        to: dateRange.to
      });
      console.log('Generated CSV length:', csvContent.length);
      console.log('Generated summary length:', summaryContent.length);

      // Generate analysis prompt
      const strategyNames = selectedStrategiesData.map(s => s.strategy_name);
      const prompt = generateStrategyAnalysisPrompt(strategyNames, {
        from: dateRange.from,
        to: dateRange.to
      });

      // Send to GPT for analysis
      const result = await analyzeWithGPT({
        csvContent,
        summaryContent,
        analysisType: 'strategy',
        prompt
      });
      setAnalysisResult(result);
      toast({
        title: "Strategy analysis completed",
        description: `Successfully analyzed ${selectedStrategies.length} strategies with ${filteredTrades.length} trades`
      });
    } catch (error: any) {
      console.error('Strategy analysis error:', error);
      setError(error.message || 'Strategy analysis failed');
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing your strategies",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleClearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };
  const handleDownloadReport = () => {
    if (!analysisResult) return;
    const strategyNames = strategies.filter(s => selectedStrategies.includes(s.strategy_id)).map(s => s.strategy_name).join(', ');
    const reportContent = `# Strategy Analysis Report
Generated: ${new Date().toLocaleString()}
Strategies: ${strategyNames}
Date Range: ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}

## Analysis Results

${analysisResult.analysis}
`;
    const blob = new Blob([reportContent], {
      type: 'text/markdown'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-analysis-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Report downloaded",
      description: "Your strategy analysis report has been saved"
    });
  };
  if (strategiesLoading || tradesLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading strategies...</span>
      </div>;
  }
  if (!strategies || strategies.length === 0) {
    return <Card>
        <CardContent className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Strategies Found</h3>
          <p className="text-muted-foreground mb-4">
            You need to create some trading strategies first before you can analyze them.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/strategies'}>
            Go to Strategies
          </Button>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Target className="h-5 w-5 text-primary" />
            AI Strategy Analysis - File-Based GPT Integration
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Select strategies and date range for AI-powered performance analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Strategies ({strategies.length} available)
              </label>
              <MultiSelectStrategies strategies={strategies} selectedStrategies={selectedStrategies} onSelectionChange={setSelectedStrategies} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangeSelector onChange={setDateRange} value={dateRange} className="w-full" />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            {analysisResult && <Button variant="outline" onClick={handleClearAnalysis} disabled={isAnalyzing}>
                Clear Analysis
              </Button>}
            <Button onClick={handleAnalyze} disabled={selectedStrategies.length === 0 || isAnalyzing} className="bg-primary hover:bg-primary/90">
              {isAnalyzing ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with GPT...
                </> : <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Strategies
                </>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Analysis Error</span>
            </div>
            <p className="text-sm mt-1 text-destructive/80">{error}</p>
          </CardContent>
        </Card>}

      {/* Analysis Results */}
      {analysisResult && <div className="space-y-6">
          {/* Download Report Button */}
          <div className="flex justify-end">
            <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>

          {/* Strategy Performance Analysis */}
          <AnalysisSection title="📊 AI Strategy Analysis Results" content={analysisResult.analysis} icon={BarChart3} iconColor="text-primary" />
        </div>}
    </div>;
};
