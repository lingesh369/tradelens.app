
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SocialShareButtons } from "./SocialShareButtons";
import { useToast } from "@/components/ui/use-toast";

interface ShareButtonProps {
  tradeId: string;
  isShared: boolean;
  onShareToggle: (shared: boolean) => void;
  isOwner?: boolean;
  variant?: "default" | "icon";
}

export function ShareButton({ 
  tradeId, 
  isShared, 
  onShareToggle, 
  isOwner = true,
  variant = "default"
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/shared/trades/${tradeId}`;

  const handleCopyLink = async () => {
    if (!isShared && isOwner) {
      toast({
        title: "Trade not shared",
        description: "Please enable sharing first to get the link",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (!isShared && isOwner) {
      toast({
        title: "Trade not shared",
        description: "Please enable sharing first to view the shared link",
        variant: "destructive"
      });
      return;
    }
    window.open(shareUrl, '_blank');
  };

  const handleToggleShare = async (checked: boolean) => {
    try {
      await onShareToggle(checked);
    } catch (error) {
      console.error("Error toggling share:", error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={variant === "icon" ? "px-3" : "flex items-center gap-2"}
        >
          <Share2 className="h-4 w-4" />
          {variant === "default" && "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4">
        <div className="space-y-4">
          {isOwner && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Public Sharing</span>
              <Switch
                checked={isShared}
                onCheckedChange={handleToggleShare}
              />
            </div>
          )}
          
          {(isShared || !isOwner) && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Link</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm bg-muted flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="pt-2">
                <SocialShareButtons shareUrl={shareUrl} tradeId={tradeId} />
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
