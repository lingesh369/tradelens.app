
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "./ShareButton";

interface SharedHeaderProps {
  username: string;
  tradeId: string;
  isShared: boolean;
  onShareToggle: (shared: boolean) => void;
}

export function SharedHeader({ username, tradeId, isShared, onShareToggle }: SharedHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Shared by @{username}
          </Badge>
        </div>
        
        <ShareButton
          tradeId={tradeId}
          isShared={isShared}
          onShareToggle={onShareToggle}
          isOwner={false}
        />
      </div>
    </div>
  );
}
