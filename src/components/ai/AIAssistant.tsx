import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ImagePreview } from './ImagePreview';
import { SuggestedPrompts } from './SuggestedPrompts';
const CHAT_STORAGE_KEY = 'ai-assistant-chat-history';
export const AIAssistant: React.FC = () => {
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    suggestedPrompts,
    error,
    retryLastMessage,
    setMessages
  } = useAIChat();
  const [inputMessage, setInputMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Fix timestamp deserialization - convert string timestamps back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.warn('Failed to load chat history:', error);
      }
    }
  }, [setMessages]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !imageFile) return;
    let imageUrl = '';
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = async e => {
        imageUrl = e.target?.result as string;
        await sendMessage(inputMessage, [], imageUrl);
        setInputMessage('');
        clearImage();
      };
      reader.readAsDataURL(imageFile);
    } else {
      await sendMessage(inputMessage);
      setInputMessage('');
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File type validation
    const allowedTypes = ['image/', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type) || file.type === type);
    
    if (!isValidType) {
      console.warn('Invalid file type. Please upload images, PDFs, or DOCX files only.');
      return;
    }
    
    // Size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.warn('File too large. Please upload files smaller than 10MB.');
      return;
    }
    
    setImageFile(file);
    
    // Only show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files, just show filename
      setImagePreview(file.name);
    }
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onload = e => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };
  const handleRetry = () => {
    if (error) {
      retryLastMessage();
    } else if (inputMessage.trim() || imageFile) {
      handleSendMessage();
    }
  };
  const handleClearMessages = () => {
    clearMessages();
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  // Function to clean markdown formatting from text
  const cleanMarkdownText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/__(.*?)__/g, '$1').replace(/_(.*?)_/g, '$1').replace(/`(.*?)`/g, '$1').replace(/^\s*[-*+]\s+/gm, '• ').replace(/^\s*\d+\.\s+/gm, '• ').replace(/^\s*#+\s+/gm, '').trim();
  };
  return <div className="flex flex-col h-[500px] md:h-[600px]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3 md:p-4 px-0 py-0">
        <div className="space-y-4">
          <ChatMessages messages={messages} isLoading={isLoading} error={error} onRetry={handleRetry} cleanText={cleanMarkdownText} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-3 md:p-4 space-y-3 bg-background">
        <SuggestedPrompts prompts={suggestedPrompts} onPromptClick={handleSuggestedPrompt} disabled={isLoading} />

        <ImagePreview imageFile={imageFile} imagePreview={imagePreview} onClearImage={clearImage} />
        
        <ChatInput inputMessage={inputMessage} onInputChange={setInputMessage} onSendMessage={handleSendMessage} onImageUpload={handleImageUpload} onPaste={handlePaste} onKeyPress={handleKeyPress} isLoading={isLoading} hasImageFile={!!imageFile} />
        
        {messages.length > 0 && <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleClearMessages} disabled={isLoading} className="text-xs md:text-sm">
              Clear Chat
            </Button>
          </div>}
      </div>
    </div>;
};