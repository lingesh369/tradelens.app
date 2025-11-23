
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, TrendingUp, FileText } from 'lucide-react';
import { ChatMessage } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  cleanText: (text: string) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, cleanText }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <Card className={cn(
        "max-w-[85%] md:max-w-[70%]",
        isUser ? "bg-primary text-primary-foreground" : "",
        message.error ? "border-destructive bg-destructive/10" : ""
      )}>
        <CardContent className="p-2 md:p-3">
          <div className="space-y-2">
            <div className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
              {isUser ? message.content : cleanText(message.content)}
            </div>
            
            {(message.hasDataContext || message.intent || message.confidence) && (
              <div className="flex gap-1 text-xs opacity-70 flex-wrap">
                {message.hasDataContext && (
                  <span className="bg-blue-500/20 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Data-Driven Analysis
                  </span>
                )}
                {message.intent && (
                  <span className="bg-purple-500/20 px-2 py-1 rounded text-xs">
                    {message.intent.replace('_', ' ').charAt(0).toUpperCase() + message.intent.replace('_', ' ').slice(1)}
                  </span>
                )}
                {message.confidence && message.confidence > 0.8 && (
                  <span className="bg-green-500/20 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    High Confidence
                  </span>
                )}
              </div>
            )}
            
            <div className="text-xs opacity-50">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
