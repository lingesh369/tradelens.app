
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasDataContext?: boolean;
  error?: boolean;
  intent?: string;
  confidence?: number;
  isGeneralResponse?: boolean;
  imageUrl?: string; // Add image URL to persist images in chat
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const sendMessage = useCallback(async (
    message: string, 
    selectedTradeIds: string[] = [], 
    imageUrl?: string
  ) => {
    if (!message.trim() && !imageUrl) {
      console.warn('Attempted to send empty message');
      return;
    }

    if (!user || !profile?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to use the AI Assistant.",
        variant: "destructive",
      });
      return;
    }

    // Clear any previous errors
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      imageUrl: imageUrl, // Persist image URL in message
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('Processing AI chat message:', { 
        messageLength: message.length, 
        hasImage: !!imageUrl,
        userId: profile.id
      });

      // Step 1: Classify user intent
      console.log('Step 1: Classifying intent...');
      const { data: intentData, error: intentError } = await supabase.functions.invoke('ai-intent-classifier', {
        body: { message },
      });

      if (intentError) {
        console.error('Intent classification error:', intentError);
        throw new Error('Failed to understand your request. Please try again.');
      }

      console.log('Intent classified:', intentData);

      // Check if we need clarification
      if (intentData.ask_user && intentData.clarification_message) {
        const clarificationMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: intentData.clarification_message,
          timestamp: new Date(),
          intent: intentData.intent,
          confidence: intentData.confidence
        };

        setMessages(prev => [...prev, clarificationMessage]);
        setIsLoading(false);
        return;
      }

      // Handle general trading questions directly
      if (intentData.is_general_question || intentData.intent === 'general_trading_question') {
        console.log('Handling general trading question directly...');
        
        const { data, error: supabaseError } = await supabase.functions.invoke('ai-chat', {
          body: {
            message,
            intent: intentData.intent,
            contextData: null,
            imageUrl,
            hasContext: false,
            isGeneralQuestion: true
          },
        });

        if (supabaseError) {
          console.error('Supabase function error:', supabaseError);
          throw new Error(supabaseError.message || 'Failed to call AI chat function');
        }

        if (data?.error) {
          console.error('AI Chat API error:', data.error);
          throw new Error(data.error);
        }

        if (!data?.response) {
          console.error('No response data received:', data);
          throw new Error('No response received from AI service');
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          hasDataContext: false,
          intent: intentData.intent,
          confidence: intentData.confidence,
          isGeneralResponse: true
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Handle data-specific analysis requests with redirection
      if (intentData.intent === 'journal_analysis' || intentData.intent === 'journal_insight') {
        console.log('Redirecting journal analysis request...');
        
        const redirectMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `For detailed analysis of your journal notes and trading psychology, please head over to the **Journal Analyser** tab in the AI Analyser section. It provides comprehensive insights into your mindset patterns and behavioral trends.`,
          timestamp: new Date(),
          intent: intentData.intent,
          confidence: intentData.confidence
        };

        setMessages(prev => [...prev, redirectMessage]);
        setIsLoading(false);
        return;
      }

      // Handle trade-specific analysis requests with redirection
      if (intentData.intent === 'trade_analysis' || intentData.intent === 'performance_analysis') {
        console.log('Redirecting trade analysis request...');
        
        const redirectMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `For detailed analysis of your trade performance and patterns, please head over to the **Trade Analyser** tab in the AI Analyser section. It provides comprehensive insights into your trading behavior and performance metrics.`,
          timestamp: new Date(),
          intent: intentData.intent,
          confidence: intentData.confidence
        };

        setMessages(prev => [...prev, redirectMessage]);
        setIsLoading(false);
        return;
      }

      // Handle strategy-specific analysis requests with redirection
      if (intentData.intent === 'strategy_analysis' || intentData.intent === 'strategy_comparison') {
        console.log('Redirecting strategy analysis request...');
        
        const redirectMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `For detailed analysis of your trading strategies and their performance, please head over to the **Strategy Analyser** tab in the AI Analyser section. It provides comprehensive insights into strategy effectiveness and optimization opportunities.`,
          timestamp: new Date(),
          intent: intentData.intent,
          confidence: intentData.confidence
        };

        setMessages(prev => [...prev, redirectMessage]);
        setIsLoading(false);
        return;
      }

      // Handle image uploads differently - skip database when image provided
      if (imageUrl) {
        console.log('Image uploaded - analyzing chart directly...');
        
        const { data, error: supabaseError } = await supabase.functions.invoke('ai-chat', {
          body: {
            message: message || 'Please analyze this chart image',
            intent: 'image_chart_analysis',
            contextData: null,
            imageUrl,
            hasContext: false,
            isGeneralQuestion: false,
            isImageAnalysis: true
          },
        });

        if (supabaseError) {
          console.error('Supabase function error:', supabaseError);
          throw new Error(supabaseError.message || 'Failed to call AI chat function');
        }

        if (data?.error) {
          console.error('AI Chat API error:', data.error);
          throw new Error(data.error);
        }

        if (!data?.response) {
          console.error('No response data received:', data);
          throw new Error('No response received from AI service');
        }

        // Add disclaimer for trading advice
        const responseWithDisclaimer = data.response + '\n\n⚠️ **Disclaimer:** This is not financial advice. Use your own judgment and risk management before making any trading decisions.';

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseWithDisclaimer,
          timestamp: new Date(),
          hasDataContext: false,
          intent: 'image_chart_analysis',
          confidence: 1.0
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // For data-specific questions without images, fetch and inject context
      let contextData = null;

      if (intentData.needed_tables && intentData.needed_tables.length > 0) {
        console.log('Step 2: Fetching user data for analysis...');
        
        const { data: fetchedContext, error: contextError } = await supabase.functions.invoke('ai-context-fetcher', {
          body: { 
            intent_data: intentData
          },
        });

        if (contextError) {
          console.error('Context fetching error:', contextError);
          // Continue without context rather than failing
        } else {
          contextData = fetchedContext;
          console.log('Context fetched successfully');
        }
      }

      // Step 3: Send to AI with user's trading data injected
      console.log('Step 3: Sending to AI with user data context...');
      const requestBody: any = {
        message,
        intent: intentData.intent,
        context: contextData, // Mapped from contextData to context
        conversationHistory: messages.map(m => ({ 
          role: m.role, 
          content: m.content 
        })), // Include history
        imageUrl: null,
        hasContext: !!contextData,
        isGeneralQuestion: false,
        isImageAnalysis: false
      };

      const { data, error: supabaseError } = await supabase.functions.invoke('ai-chat', {
        body: requestBody,
      });

      if (supabaseError) {
        console.error('Supabase function error:', supabaseError);
        throw new Error(supabaseError.message || 'Failed to call AI chat function');
      }

      if (data?.error) {
        console.error('AI Chat API error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.response) {
        console.error('No response data received:', data);
        throw new Error('No response received from AI service');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        hasDataContext: !!contextData,
        intent: intentData.intent,
        confidence: intentData.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      console.log('AI response added successfully');
      
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response. Please try again.';
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        error: true,
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
      setError(errorMessage);
      
      toast({
        title: "AI Assistant Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      // Remove the last assistant message if it was an error
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.role === 'assistant' && m.error));
        return filtered;
      });
      
      // Resend the last user message
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  // Updated suggested prompts - general trading knowledge questions
  const suggestedPrompts = [
    "How do I build a winning trading routine?",
    "What's the best way to manage risk per trade?",
    "How do I avoid revenge trading?",
    "How can I improve my trading psychology?",
    "What's the ideal risk-to-reward ratio for beginners?",
    "How do professional traders stay disciplined?",
    "What are the top reasons traders fail?",
    "What's a good checklist before entering a trade?"
  ];

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
    suggestedPrompts,
    setMessages,
  };
};
