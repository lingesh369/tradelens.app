
import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CSVUploadStep } from "@/components/csv-converter/CSVUploadStep";
import { CSVMappingStep } from "@/components/csv-converter/CSVMappingStep";
import { CSVPreviewStep } from "@/components/csv-converter/CSVPreviewStep";

export interface CSVData {
  headers: string[];
  data: any[];
  mappings: Record<string, string>;
  processedData?: any[];
}

const CSVConverter = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [csvData, setCsvData] = useState<CSVData>({
    headers: [],
    data: [],
    mappings: {}
  });
  const isMobile = useIsMobile();

  const steps = [
    { id: 1, title: "Upload CSV", description: "Upload your CSV file" },
    { id: 2, title: "Map Columns", description: "Map your columns to TradeLens fields" },
    { id: 3, title: "Preview & Process", description: "Review and download processed data" }
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleStepComplete = (step: number, data?: Partial<CSVData>) => {
    if (data) {
      setCsvData(prev => ({ ...prev, ...data }));
    }
    setCurrentStep(step + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setCsvData({
      headers: [],
      data: [],
      mappings: {}
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} forceCollapsible={isMobile} />
      
      <div className="flex-1 lg:ml-56 overflow-hidden">
        <TopBar title="Convert Your CSV" showMobileMenu={isMobile} onMobileMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="p-3 sm:p-4 lg:p-6 overflow-auto h-[calc(100vh-64px)]">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">CSV Converter</CardTitle>
                <div className="space-y-4">
                  <Progress value={progressPercentage} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    {steps.map((step, index) => (
                      <div key={step.id} className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${
                          currentStep >= step.id 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {step.id}
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{step.title}</div>
                          <div className="text-xs hidden sm:block">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Step Content */}
            <Card>
              <CardContent className="p-6">
                {currentStep === 1 && (
                  <CSVUploadStep
                    onComplete={(data) => handleStepComplete(1, data)}
                  />
                )}
                {currentStep === 2 && (
                  <CSVMappingStep
                    csvData={csvData}
                    onComplete={(data) => handleStepComplete(2, data)}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 3 && (
                  <CSVPreviewStep
                    csvData={csvData}
                    onBack={handleBack}
                    onReset={handleReset}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CSVConverter;
