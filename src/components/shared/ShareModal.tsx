
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { SocialShareButtons } from "./SocialShareButtons";
import { useToast } from "@/components/ui/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  isShared: boolean;
  onShareToggle: (shared: boolean) => void;
}

export function ShareModal({ isOpen, onClose, tradeId, isShared, onShareToggle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/shared/trades/${tradeId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  const handleToggleShare = async (checked: boolean) => {
    await onShareToggle(checked);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trade</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label htmlFor="share-toggle" className="text-sm font-medium">
                Enable Public Sharing
              </label>
              <p className="text-xs text-muted-foreground">
                Make this trade publicly viewable via a shared link
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={isShared}
              onCheckedChange={handleToggleShare}
            />
          </div>
          
          {isShared && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Link</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view your trade details
                </p>
              </div>
              
              <SocialShareButtons shareUrl={shareUrl} tradeId={tradeId} />
            </div>
          )}
          
          {!isShared && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Enable sharing to generate a public link for this trade
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
