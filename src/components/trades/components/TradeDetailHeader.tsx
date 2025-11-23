
import { Badge } from "@/components/ui/badge";
import { TradePnLBadge } from "./TradePnLBadge";
import { ShareButton } from "@/components/shared/ShareButton";
import { useIsMobile } from "@/hooks/use-mobile";

interface TradeDetailHeaderProps {
  instrument: string;
  action: string;
  pnl: number;
  pnlPercent: number;
  entryDate: string;
  tradeId?: string;
  isShared?: boolean;
  onShareToggle?: (shared: boolean) => void;
  isReadOnly?: boolean;
}

export function TradeDetailHeader({
  instrument,
  action,
  pnl,
  pnlPercent,
  entryDate,
  tradeId,
  isShared = false,
  onShareToggle = () => {},
  isReadOnly = false
}: TradeDetailHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className={`flex items-center gap-3 flex-wrap ${isMobile ? 'flex-col items-start' : ''}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{instrument}</h1>
            <Badge variant={action === "buy" ? "default" : "secondary"}>
              {action.toUpperCase()}
            </Badge>
            {!isMobile && <TradePnLBadge pnl={pnl} pnlPercent={pnlPercent} />}
          </div>
          {isMobile && <TradePnLBadge pnl={pnl} pnlPercent={pnlPercent} />}
        </div>
        
        <div className="flex items-center gap-2">
          {tradeId && !isReadOnly && (
            <ShareButton
              tradeId={tradeId}
              isShared={isShared}
              onShareToggle={onShareToggle}
              variant={isMobile ? "icon" : "default"}
            />
          )}
        </div>
      </div>
      <p className="text-muted-foreground mt-1 text-sm sm:text-base">
        {new Date(entryDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>
    </>
  );
}
