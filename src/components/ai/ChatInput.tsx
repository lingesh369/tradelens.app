
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  hasImageFile: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  onInputChange,
  onSendMessage,
  onImageUpload,
  onPaste,
  onKeyPress,
  isLoading,
  hasImageFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2">
      <div className="flex-1 flex gap-2">
        <Input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          placeholder="Ask about your trades, strategies, performance, or paste/upload a chart..."
          disabled={isLoading}
          className="text-sm md:text-base"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.docx"
          onChange={onImageUpload}
          className="hidden"
          multiple={false}
        />
        <Button
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0"
          title="Upload chart screenshot or paste from clipboard (Ctrl+V)"
        >
          <Image className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={onSendMessage}
        disabled={isLoading || (!inputMessage.trim() && !hasImageFile)}
        size="icon"
        className="flex-shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
