import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TraderProfileSocialShareButtons } from "./TraderProfileSocialShareButtons";
import { useToast } from "@/components/ui/use-toast";

interface TraderProfileShareButtonProps {
  username: string;
  traderName: string;
  variant?: "default" | "icon";
}

export function TraderProfileShareButton({ 
  username,
  traderName,
  variant = "default"
}: TraderProfileShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/traders/${username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Trader profile link has been copied to clipboard",
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
    window.open(shareUrl, '_blank');
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
            <p className="text-xs text-muted-foreground">
              Share this trader's profile with others
            </p>
          </div>
          
          <div className="pt-2">
            <TraderProfileSocialShareButtons 
              shareUrl={shareUrl} 
              traderName={traderName}
              username={username}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}