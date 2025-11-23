import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangeSelector, DateRange } from '@/components/filters/DateRangeSelector';
import { MultiSelectTrades } from '@/components/ui/multi-select-trades';
import { useTrades } from '@/hooks/useTrades';
import { Loader2, TrendingUp, AlertTriangle, Brain, CheckCircle, Target, BarChart3, PieChart, Info, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnalysisSection } from '@/components/ai/AnalysisSection';
import { generateTradesCsv, generateTradesSummary, AnalysisFilters } from '@/services/ai/fileBasedAnalysis';
import { analyzeWithGPT, generateTradeAnalysisPrompt, GPTAnalysisResponse } from '@/services/ai/gptIntegration';

// Helper function to get today's date range
const getTodayDateRange = (): DateRange => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  return {
    from: startOfDay,
    to: endOfDay,
    preset: "today"
  };
};
export const TradeAnalyzer: React.FC = () => {
  const {
    trades,
    isLoading: tradesLoading
  } = useTrades();
  const {
    toast
  } = useToast();

  // Set default date range to today
  const [dateRange, setDateRange] = useState<DateRange>(getTodayDateRange());
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GPTAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter trades based on date range
  useEffect(() => {
    if (!trades) {
      setFilteredTrades([]);
      setSelectedTrades([]);
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      setFilteredTrades(trades);
      setSelectedTrades(trades.map(trade => trade.trade_id));
      return;
    }
    const filtered = trades.filter(trade => {
      const tradeDateTime = trade.entry_time || trade.trade_date;
      if (!tradeDateTime) return false;
      const tradeDate = new Date(tradeDateTime);
      return tradeDate >= dateRange.from && tradeDate <= dateRange.to;
    });
    setFilteredTrades(filtered);
    setSelectedTrades(filtered.map(trade => trade.trade_id));
  }, [trades, dateRange]);
  const handleAnalyze = async () => {
    if (selectedTrades.length === 0 || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "No trades selected",
        description: "Please select trades to analyze",
        variant: "destructive"
      });
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      // Get selected trades data
      const selectedTradesData = filteredTrades.filter(trade => selectedTrades.includes(trade.trade_id));
      console.log('Analyzing trades:', selectedTradesData.length);

      // Generate CSV and summary files
      const csvContent = generateTradesCsv(selectedTradesData);
      const summaryContent = generateTradesSummary(selectedTradesData, {
        from: dateRange.from,
        to: dateRange.to
      }, "Improve trading performance and identify behavioral patterns");
      console.log('Generated CSV length:', csvContent.length);
      console.log('Generated summary length:', summaryContent.length);

      // Generate analysis prompt
      const prompt = generateTradeAnalysisPrompt({
        from: dateRange.from,
        to: dateRange.to
      });

      // Send to GPT for analysis
      const result = await analyzeWithGPT({
        csvContent,
        summaryContent,
        analysisType: 'trade',
        prompt
      });
      setAnalysisResult(result);
      toast({
        title: "Analysis completed",
        description: `Successfully analyzed ${selectedTrades.length} trades`
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Analysis failed');
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing your trades",
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
    const reportContent = `# Trade Analysis Report
Generated: ${new Date().toLocaleString()}
Date Range: ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}
Trades Analyzed: ${selectedTrades.length}

## Analysis Results

${analysisResult.analysis}
`;
    const blob = new Blob([reportContent], {
      type: 'text/markdown'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-analysis-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Report downloaded",
      description: "Your analysis report has been saved"
    });
  };
  if (tradesLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading trades...</span>
      </div>;
  }
  return <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Trade Analysis - File-Based GPT Integration
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Select trades and date range for AI-powered analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangeSelector onChange={setDateRange} value={dateRange} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Analysis starts with today by default. Expand range as needed.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Trades ({filteredTrades.length} available)
              </label>
              
              
              
              {filteredTrades.length > 0 ? <MultiSelectTrades trades={filteredTrades} selectedTrades={selectedTrades} onSelectionChange={setSelectedTrades} /> : <div className="p-4 text-center text-muted-foreground bg-muted/50 rounded-lg">
                  No trades found for the selected date range. Try expanding the date range or check if you have trades for today.
                </div>}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            {analysisResult && <Button variant="outline" onClick={handleClearAnalysis} disabled={isAnalyzing}>
                Clear Analysis
              </Button>}
            <Button onClick={handleAnalyze} disabled={selectedTrades.length === 0 || isAnalyzing} className="bg-primary hover:bg-primary/90">
              {isAnalyzing ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with GPT...
                </> : <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze with AI
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

          {/* Performance Summary */}
          <AnalysisSection title="📊 Performance Summary" content={analysisResult.sections.performanceSummary || ''} icon={BarChart3} iconColor="text-primary" />

          {/* Behavioral Patterns */}
          <AnalysisSection title="🧠 Behavioral Patterns" content={analysisResult.sections.behavioralPatterns || ''} icon={PieChart} iconColor="text-blue-500" />

          {/* Risk Evaluation */}
          <AnalysisSection title="⚖️ Risk Evaluation" content={analysisResult.sections.riskEvaluation || ''} icon={Target} iconColor="text-orange-500" />

          {/* AI Suggestions */}
          <AnalysisSection title="✅ AI Improvement Suggestions" content={analysisResult.sections.suggestions} icon={CheckCircle} iconColor="text-green-500" />
        </div>}
    </div>;
};