
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StrategyRuleItemProps {
  text?: string;
  description?: string;
  type: "entry" | "exit" | "management";
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StrategyRuleItem({ text, description, type, onEdit, onDelete }: StrategyRuleItemProps) {
  // Use either text or description prop, with text taking precedence
  const title = text || "";
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Badge
            variant={
              type === "entry" ? "default" : 
              type === "exit" ? "destructive" : 
              "secondary" // Use secondary for management type
            }
            className="uppercase text-xs"
          >
            {type}
          </Badge>
          <p className="font-medium">{title}</p>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      {description && <p className="text-sm text-muted-foreground pl-9">{description}</p>}
    </Card>
  );
}
