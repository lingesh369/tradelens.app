
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Sparkles, Bot, TrendingUp, BarChart3, Brain, MessageSquare, Target, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { TradeAnalyzer } from "@/components/ai/TradeAnalyzer";
import { StrategyAnalyzer } from "@/components/ai/StrategyAnalyzer";
import { NotesAnalyzer } from "@/components/ai/NotesAnalyzer";

export default function AICoPilot() {
  const {
    access,
    isLoading
  } = usePlanAccess();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assistant");
  const [analyzerTab, setAnalyzerTab] = useState("trade-analyzer");

  // Default date range for Notes Analyzer (last 30 days)
  const defaultDateRange = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  };

  const handleUpgrade = () => {
    navigate("/subscription");
  };

  if (isLoading) {
    return <Layout title="AI Co-Pilot">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading AI Co-Pilot...</span>
        </div>
      </Layout>;
  }

  // Check if user has Pro plan access
  const hasProAccess = access?.planName === 'Pro Plan' || access?.planName === 'Pro';
  if (!hasProAccess) {
    return <Layout title="AI Co-Pilot">
        <div className="relative min-h-screen">
          {/* Blurred background content */}
          <div className="blur-sm pointer-events-none">
            <div className="container mx-auto px-4 py-4 md:py-8">
              <div className="text-center mb-6 md:mb-8">
                <Bot className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-primary opacity-50" />
                <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">AI Co-Pilot</h1>
                <p className="text-lg md:text-xl text-muted-foreground px-4">
                  Your intelligent trading assistant powered by advanced AI
                </p>
              </div>

              {/* Tab Preview */}
              <div className="flex justify-center mb-6 md:mb-8">
                <div className="flex bg-muted p-1 rounded-lg opacity-50 overflow-x-auto">
                   <div className="px-3 py-2 md:px-4 md:py-2 rounded-md bg-background flex items-center gap-2 whitespace-nowrap">
                     <MessageSquare className="h-4 w-4" />
                     <span className="text-sm">AI Assistant</span>
                   </div>
                   <div className="px-3 py-2 md:px-4 md:py-2 flex items-center gap-2 whitespace-nowrap">
                     <BarChart3 className="h-4 w-4" />
                     <span className="text-sm">AI Analyser</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <Card className="opacity-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Brain className="h-4 w-4 md:h-5 md:w-5" />
                      Smart Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Get AI-powered insights on your trading patterns and performance.</p>
                  </CardContent>
                </Card>

                <Card className="opacity-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                      Market Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Receive personalized market analysis and trend predictions.</p>
                  </CardContent>
                </Card>

                <Card className="opacity-50 md:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                      Performance Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Get recommendations to improve your trading strategies.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Upgrade modal overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl border-2">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Lock className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <CardTitle className="text-xl md:text-2xl">Unlock AI Co-Pilot</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Access powerful AI-driven trading insights and recommendations with the Pro Plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">AI-powered trading analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Personalized market insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Performance optimization tips</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Advanced strategy recommendations</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={handleUpgrade} className="w-full text-base md:text-lg py-4 md:py-6" size="lg">
                    Upgrade to Pro Plan
                  </Button>
                </div>
                
                <p className="text-center text-xs md:text-sm text-muted-foreground">
                  Current plan: {access?.planName || 'Free Trial'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>;
  }

  // Pro plan users see the actual AI Co-Pilot content
  return <Layout title="AI Co-Pilot">
      <div className="container mx-auto px-4 md:py-8 py-[17px]">
        <div className="text-center mb-6 md:mb-8">
          
          <h1 className="text-2xl font-bold mb-2 md:mb-4 text-left md:text-2xl">AI Insights</h1>
          <p className="text-lg text-muted-foreground font-light md:text-base text-left px-[4px]">Your personalized AI to review trades, improve strategies, and grow your edge.

        </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-auto">
            <TabsTrigger value="assistant" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs md:text-sm">AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="analyser" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs md:text-sm">AI Analyser</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Trading Assistant
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Chat with your AI trading mentor. Ask about your trades, get strategy advice, or upload chart screenshots for analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                <AIAssistant />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyser" className="space-y-4">
            <Tabs value={analyzerTab} onValueChange={setAnalyzerTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
                <TabsTrigger value="trade-analyzer" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs md:text-sm">Trade Analyser</span>
                </TabsTrigger>
                <TabsTrigger value="strategy-analyzer" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2">
                  <Target className="h-4 w-4" />
                  <span className="text-xs md:text-sm">Strategy Analyser</span>
                </TabsTrigger>
                <TabsTrigger value="notes-analyzer" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs md:text-sm">Notes Analyser</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trade-analyzer">
                <TradeAnalyzer />
              </TabsContent>

              <TabsContent value="strategy-analyzer">
                <StrategyAnalyzer />
              </TabsContent>

              <TabsContent value="notes-analyzer">
                <NotesAnalyzer dateRange={defaultDateRange} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
}
