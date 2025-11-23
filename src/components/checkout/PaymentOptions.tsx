
import { DollarSign, Bitcoin, AlertCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { IndianRupee } from "lucide-react";
import PayPalCheckout from "./PayPalCheckout";
import CashfreePaymentFlow from "./CashfreePaymentFlow";

interface PaymentOptionsProps {
  activeMethod: string;
  onMethodChange: (method: string) => void;
  userDetails?: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  planId?: string;
  amount?: number;
  billingCycle?: string;
  couponData?: {
    id: string;
    code: string;
    discountAmount: number;
  };
  planDetails?: {
    name: string;
    plan_id?: string | number;
  };
  onPaymentComplete?: () => void;
}

export default function PaymentOptions({ 
  activeMethod, 
  onMethodChange,
  userDetails,
  planId,
  amount,
  billingCycle,
  couponData,
  planDetails,
  onPaymentComplete
}: PaymentOptionsProps) {

  const handleMethodChange = (value: string) => {
    onMethodChange(value);
  };

  const renderPaymentMethodContent = () => {
    switch (activeMethod) {
      case "paypal":
        return (
          <div className="space-y-4 mt-4">
            <Alert className="bg-muted/50 border-none">
              <AlertDescription className="text-foreground space-y-3">
                <div>
                  <strong>PayPal Payment:</strong> International payment accepted globally in 200+ countries and 25 currencies. 
                  Securely pay with your PayPal balance, linked bank account, or credit/debit cards.
                </div>
                {planId && amount && billingCycle && (
                  <PayPalCheckout
                    planId={planId}
                    amount={amount}
                    billingCycle={billingCycle}
                    onSuccess={onPaymentComplete}
                    couponData={couponData}
                  />
                )}
              </AlertDescription>
            </Alert>
          </div>
        );
      
      case "crypto":
        return (
          <div className="space-y-4 mt-4">
            <Alert className="bg-muted/50 border-none">
              <AlertDescription className="text-foreground">
                <strong>Crypto Payment:</strong> Accept over 300 cryptocurrencies including Bitcoin, Ethereum, and stablecoins. 
                Powered by NOWPayments.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Supported cryptocurrencies:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Bitcoin (BTC)</li>
                  <li>Ethereum (ETH)</li>
                  <li>USDT, USDC (Stablecoins)</li>
                  <li>And 300+ other cryptocurrencies</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "upi":
        return (
          <div className="space-y-4 mt-4">
            <Alert className="bg-muted/50 border-none">
              <AlertDescription className="text-foreground">
                <strong>India Preferred Payment</strong> – All UPI apps, Debit and Credit Cards, and NetBanking accepted
              </AlertDescription>
            </Alert>
          </div>
        );
      
      case "cashfree":
        return (
          <div className="space-y-4 mt-4">
            <Alert className="bg-muted/50 border-none">
              <AlertDescription className="text-foreground space-y-3">
                <div>
                  <strong>UPI Payment:</strong> Secure payment gateway for Indian customers. 
                  Accept UPI, Cards, Net Banking, and Wallets.
                </div>
                {planId && amount && billingCycle && userDetails && (
                  <div className="pt-2">
                    <CashfreePaymentFlow
                      planId={planId}
                      billingCycle={billingCycle}
                      amount={amount}
                      userDetails={userDetails}
                      onPaymentComplete={onPaymentComplete || (() => {})}
                      couponData={couponData}
                      planDetails={planDetails}
                    />
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2 text-foreground">Payment Method</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose your preferred payment method</p>

        <RadioGroup 
          value={activeMethod} 
          onValueChange={handleMethodChange}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
        >
          <Card className={`relative cursor-pointer transition-all ${activeMethod === "paypal" ? "border-primary bg-primary/5" : "hover:border-gray-300"}`}>
            <CardContent className="flex items-center gap-3 pt-4">
              <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
              <Label htmlFor="paypal" className="cursor-pointer flex items-center gap-2 w-full text-foreground">
                <div className={`size-5 rounded-full border flex items-center justify-center ${activeMethod === "paypal" ? "border-primary" : "border-gray-300"}`}>
                  {activeMethod === "paypal" && <div className="size-3 rounded-full bg-primary" />}
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>PayPal</span>
              </Label>
            </CardContent>
          </Card>

          <Card className={`relative cursor-pointer transition-all ${activeMethod === "crypto" ? "border-primary bg-primary/5" : "hover:border-gray-300"}`}>
            <CardContent className="flex items-center gap-3 pt-4">
              <RadioGroupItem value="crypto" id="crypto" className="sr-only" />
              <Label htmlFor="crypto" className="cursor-pointer flex items-center gap-2 w-full text-foreground">
                <div className={`size-5 rounded-full border flex items-center justify-center ${activeMethod === "crypto" ? "border-primary" : "border-gray-300"}`}>
                  {activeMethod === "crypto" && <div className="size-3 rounded-full bg-primary" />}
                </div>
                <Bitcoin className="h-4 w-4 text-muted-foreground" />
                <span>Crypto</span>
              </Label>
            </CardContent>
          </Card>

          <Card className={`relative cursor-pointer transition-all ${activeMethod === "cashfree" ? "border-primary bg-primary/5" : "hover:border-gray-300"}`}>
            <CardContent className="flex items-center gap-3 pt-4">
              <RadioGroupItem value="cashfree" id="cashfree" className="sr-only" />
              <Label htmlFor="cashfree" className="cursor-pointer flex items-center gap-2 w-full text-foreground">
                <div className={`size-5 rounded-full border flex items-center justify-center ${activeMethod === "cashfree" ? "border-primary" : "border-gray-300"}`}>
                  {activeMethod === "cashfree" && <div className="size-3 rounded-full bg-primary" />}
                </div>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span>UPI</span>
              </Label>
            </CardContent>
          </Card>

          {/* UPI (Ext) - Hidden but keeping the code for future use */}
          {false && (
            <Card className={`relative cursor-pointer transition-all ${activeMethod === "upi" ? "border-primary bg-primary/5" : "hover:border-gray-300"}`}>
              <CardContent className="flex items-center gap-3 pt-4">
                <RadioGroupItem value="upi" id="upi" className="sr-only" />
                <Label htmlFor="upi" className="cursor-pointer flex items-center gap-2 w-full text-foreground">
                  <div className={`size-5 rounded-full border flex items-center justify-center ${activeMethod === "upi" ? "border-primary" : "border-gray-300"}`}>
                    {activeMethod === "upi" && <div className="size-3 rounded-full bg-primary" />}
                  </div>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span>UPI (Ext)</span>
                </Label>
              </CardContent>
            </Card>
          )}
        </RadioGroup>
      </div>

      {renderPaymentMethodContent()}
    </div>
  );
}
