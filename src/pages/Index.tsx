
import HomeSection from "@/components/landing/HomeSection";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header activeSection="home" />
      
      <main className="flex-1">
        <HomeSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
