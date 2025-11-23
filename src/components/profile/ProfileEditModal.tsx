
import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialLinksTab } from "./SocialLinksTab";
import { AccountDateSettings } from "./AccountDateSettings";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traderData: any;
  onUpdate: () => void;
}

export const ProfileEditModal = ({ open, onOpenChange, traderData, onUpdate }: ProfileEditModalProps) => {
  const [activeTab, setActiveTab] = useState("social");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Profile
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="social">Social Links</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-6">
            <SocialLinksTab onSave={onUpdate} username={traderData?.username} />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <AccountDateSettings onSave={onUpdate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
