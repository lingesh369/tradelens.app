
import { ReactNode } from "react";

interface TradeDetailLayoutProps {
  timeline: ReactNode;
  desktopContent: ReactNode;
  mobileContent: ReactNode;
}

export function TradeDetailLayout({ timeline, desktopContent, mobileContent }: TradeDetailLayoutProps) {
  return (
    <>
      {/* Trade Timeline Section */}
      {timeline}

      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {desktopContent}
      </div>

      {/* Mobile/Tablet Layout - Stacked with tabs */}
      <div className="lg:hidden">
        {mobileContent}
      </div>
    </>
  );
}
