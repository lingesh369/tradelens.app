
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HomeSection = () => {
  return (
    <div>
      {/* Hero Section with new image */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Master Your Trading Journey
              </h1>
              <p className="text-xl text-muted-foreground">
                Track, analyze, and improve your trading performance with TradeLens's powerful journaling and analytics platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Start 7-Day Free Trial 
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="https://peakify.store/tradelens-pricing/">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Pricing
                  </Button>
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required. Cancel anytime.
              </p>
            </div>
            <div className="bg-card border rounded-xl shadow-md p-2 overflow-hidden">
              <img 
                src="/placeholder.svg" 
                alt="TradeLens Dashboard" 
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose TradeLens?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive trading journal helps you identify patterns, refine strategies, and achieve consistent profitability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Every Trade</h3>
              <p className="text-muted-foreground">
                Record all your trades in one place with detailed metrics to understand your performance.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze Performance</h3>
              <p className="text-muted-foreground">
                Powerful analytics to identify your strengths and weaknesses across different markets and strategies.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M12 8c1-.56 2.78-2 5-2 .97 0 1.94.28 2.79.78"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Improve Strategy</h3>
              <p className="text-muted-foreground">
                Build and refine your trading strategies based on real data and proven results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/10 rounded-lg mx-4 my-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Trading?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start your 7-day free trial today and see the difference.
          </p>
          <Link to="/auth">
            <Button size="lg" className="group">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeSection;
