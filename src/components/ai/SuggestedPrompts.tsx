
import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  disabled?: boolean;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ 
  prompts, 
  onPromptClick, 
  disabled = false 
}) => {
  return (
    <div className="mb-3">
      <div className="text-xs text-muted-foreground mb-2 px-1">
        General Trading Knowledge & Guidance
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {prompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onPromptClick(prompt)}
              className="flex-shrink-0 text-xs whitespace-nowrap"
              disabled={disabled}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
