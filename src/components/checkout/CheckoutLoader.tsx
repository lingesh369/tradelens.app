
import { Loader2 } from "lucide-react";

interface CheckoutLoaderProps {
  message?: string;
}

export default function CheckoutLoader({ message = "Loading..." }: CheckoutLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold">{message}</h2>
        <p className="text-muted-foreground">Please wait while we prepare your checkout</p>
      </div>
    </div>
  );
}
