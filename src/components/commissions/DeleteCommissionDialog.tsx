
import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCommissions, Commission } from "@/hooks/useCommissions";
import { Loader2 } from "lucide-react";

interface DeleteCommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: Commission | null;
}

export function DeleteCommissionDialog({ open, onOpenChange, commission }: DeleteCommissionDialogProps) {
  const { deleteCommission } = useCommissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!commission) return;
    
    setIsDeleting(true);
    try {
      await deleteCommission(commission.commission_id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting fee structure:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!commission) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the commission and fee structure for <strong>{commission.market_type}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Fee Structure"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
