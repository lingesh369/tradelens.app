
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Features = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header activeSection="features" />
      
      <main className="flex-1">
        <FeaturesSection />
        
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
      </main>

      <Footer />
    </div>
  );
};

export default Features;
