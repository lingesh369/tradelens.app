
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const FeaturesSection = () => {
  return (
    <div>
      {/* Header */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">Powerful Features for Serious Traders</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to track, analyze, and improve your trading performance in one place.
          </p>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Dashboard</h3>
                <p className="text-muted-foreground">
                  Get a birds-eye view of your trading performance with key metrics and trends all in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Detailed Trade Journal</h3>
                <p className="text-muted-foreground">
                  Record every aspect of your trades including entry/exit points, rationale, and lessons learned.
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Performance Analytics</h3>
                <p className="text-muted-foreground">
                  Analyze your trading patterns with detailed metrics like win rate, profit factor, and drawdown analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Strategy Management</h3>
                <p className="text-muted-foreground">
                  Track and compare different trading strategies to identify what works best for your style.
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Chart Uploads & Annotations</h3>
                <p className="text-muted-foreground">
                  Upload and annotate charts to document your trade setups and execution points.
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Trade Calendar</h3>
                <p className="text-muted-foreground">
                  Visualize your trading activity over time to identify patterns in your trading frequency and results.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-20 bg-muted/30 rounded-lg mx-4 my-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Transform Your Trading Journey</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Identify Winning Patterns</h3>
                    <p className="text-muted-foreground">Discover what works in your trading by analyzing your successful trades.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Eliminate Bad Habits</h3>
                    <p className="text-muted-foreground">Spot and correct recurring mistakes that are limiting your profitability.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Track Progress Over Time</h3>
                    <p className="text-muted-foreground">See how your trading evolves and improves with consistent journaling.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Build Trading Discipline</h3>
                    <p className="text-muted-foreground">Develop consistent routines and habits that lead to long-term success.</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link to="/auth">
                    <Button>Start Free Trial Now</Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg shadow-md p-4">
              <img 
                src="/placeholder.svg" 
                alt="TradeLens Analytics" 
                className="rounded-md w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesSection;
