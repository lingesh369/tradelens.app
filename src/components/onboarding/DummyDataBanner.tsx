
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DummyDataBannerProps {
  message: string;
  className?: string;
}

export function DummyDataBanner({ 
  message, 
  className = "" 
}: DummyDataBannerProps) {
  return (
    <Alert className={`border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900 ${className}`}>
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        {message}
      </AlertDescription>
    </Alert>
  );
}
