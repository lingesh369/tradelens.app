
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, FileText, Image, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useJournal } from "@/hooks/useJournal";
import { useTrades } from "@/hooks/useTrades";
import { useSimpleJournal } from "@/hooks/useSimpleJournal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotesAnalyzerProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function NotesAnalyzer({ dateRange }: NotesAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [notesData, setNotesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { journals } = useJournal();
  const { trades } = useTrades();
  const { toast } = useToast();

  // Filter data by date range
  const filteredData = useMemo(() => {
    const from = dateRange.from;
    const to = dateRange.to;
    
    // Filter journals by date range
    const filteredJournals = journals.filter(journal => {
      if (!journal.journal_date) return false;
      const journalDate = new Date(journal.journal_date);
      return journalDate >= from && journalDate <= to;
    });

    // Filter trades by date range 
    const filteredTrades = trades.filter(trade => {
      if (!trade.entry_time) return false;
      const tradeDate = new Date(trade.entry_time);
      return tradeDate >= from && tradeDate <= to;
    });

    return { journals: filteredJournals, trades: filteredTrades };
  }, [journals, trades, dateRange]);

  // Calculate note counts using the new auto-updating columns
  const noteCounts = useMemo(() => {
    const journalNotesCount = filteredData.journals.filter(j => j.notes && j.notes.trim()).length;
    const tradeNotesCount = filteredData.journals.filter(j => j.all_trades_notes && j.all_trades_notes.trim()).length;
    const imageNotesCount = filteredData.journals.filter(j => j.all_journal_images_notes && j.all_journal_images_notes.trim()).length;
    
    return {
      journal: journalNotesCount,
      trades: tradeNotesCount,
      images: imageNotesCount,
      total: journalNotesCount + tradeNotesCount + imageNotesCount
    };
  }, [filteredData]);

  const handleAnalyze = async () => {
    if (noteCounts.total === 0) {
      toast({
        title: "No Notes Found",
        description: "Please select a date range that contains journal entries, trade notes, or image notes.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis("");

    try {
      // Prepare data using the new auto-updating columns
      const analysisData = {
        dateRange: {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd')
        },
        journalData: filteredData.journals.map(journal => ({
          date: journal.journal_date,
          notes: journal.notes || '',
          all_trades_notes: journal.all_trades_notes || '',
          all_journal_images_notes: journal.all_journal_images_notes || ''
        })),
        tradeData: filteredData.trades.map(trade => ({
          date: trade.entry_time ? format(new Date(trade.entry_time), 'yyyy-MM-dd') : '',
          instrument: trade.instrument,
          action: trade.action,
          notes: trade.notes || '',
          net_pl: trade.net_pl || 0
        }))
      };

      console.log("Sending analysis data:", analysisData);

      const { data, error } = await supabase.functions.invoke('analyze-trades-with-gpt', {
        body: analysisData
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to analyze notes");
      }

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast({
          title: "Analysis Complete",
          description: "Your trading notes have been analyzed successfully."
        });
      } else {
        throw new Error("No analysis returned from the service");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze your notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Notes Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {noteCounts.journal} Journal
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {noteCounts.trades} Trade
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                {noteCounts.images} Image
              </Badge>
            </div>
          </div>

          {noteCounts.total === 0 && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                No notes found in the selected date range. Please select a different date range or add some notes first.
              </span>
            </div>
          )}

          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || noteCounts.total === 0}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing your notes...
              </>
            ) : (
              `Analyze ${noteCounts.total} Notes`
            )}
          </Button>

          {analysis && (
            <div className="space-y-2">
              <h4 className="font-medium">Analysis Results:</h4>
              <Textarea 
                value={analysis}
                readOnly
                className="min-h-[300px] resize-none"
                placeholder="Analysis results will appear here..."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
