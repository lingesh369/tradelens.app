
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TradeDetailActionsProps {
  hasChanges: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
  hideBackButton?: boolean;
  breadcrumbElement?: React.ReactNode;
}

export function TradeDetailActions({
  hasChanges,
  isSaving,
  onBack,
  onSave,
  onDiscard,
  onDelete,
  isReadOnly = false,
  hideBackButton = false,
  breadcrumbElement
}: TradeDetailActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4 sm:pt-0">
      {/* Breadcrumb on the left */}
      <div className="flex-1">
        {breadcrumbElement}
      </div>
      
      {/* Action buttons on the right */}
      {!hideBackButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {!isReadOnly && (
        <div className="flex items-center gap-2">
          {hasChanges && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onDiscard}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Discard Changes</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={onSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Changes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Trade</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
