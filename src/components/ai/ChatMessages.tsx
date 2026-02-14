import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage } from '@/hooks/useAIChat';
import { MessageBubble } from './MessageBubble';
interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  cleanText: (text: string) => string;
}
export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  cleanText
}) => {
  if (messages.length === 0) {
    return <div className="text-center md:py-[18px] py-[20px]">
        <div className="mb-4 md:mb-6 py-0">
          <Bot className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-base md:text-lg font-semibold mb-2">AI Trading Assistant</h3>
          <p className="text-sm md:text-base text-muted-foreground px-4">
            Ask me anything about your trades, strategies, or upload a chart for analysis! 
            I can automatically access your trading data to provide personalized insights.
          </p>
        </div>
      </div>;
  }
  return <>
      {messages.map(message => <MessageBubble key={message.id} message={message} cleanText={cleanText} />)}
      
      {isLoading && <div className="flex justify-start">
          <Card className="max-w-[85%] md:max-w-xs">
            <CardContent className="p-2 md:p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs md:text-sm">AI is analyzing your data...</span>
              </div>
            </CardContent>
          </Card>
        </div>}
      
      {error && <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span className="text-sm">{error}</span>
            <Button variant="outline" size="sm" onClick={onRetry} className="self-start md:self-auto">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>}
    </>;
};
