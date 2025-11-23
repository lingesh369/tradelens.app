
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Chat {
  chat_id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  other_participant?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export const useChat = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      // The user.id from auth IS the user_id in app_users and other tables
      const userId = user.id;

      // Using type assertion since the types haven't been updated yet
      const { data, error } = await (supabase as any)
        .from('chats')
        .select(`
          *,
          participant1:app_users!chats_participant1_id_fkey(id, username, first_name, last_name, avatar_url),
          participant2:app_users!chats_participant2_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const chatsWithParticipants = data?.map((chat: any) => ({
        ...chat,
        other_participant: chat.participant1_id === userId ? chat.participant2 : chat.participant1
      })) || [];

      setChats(chatsWithParticipants);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const createOrGetChat = useCallback(async (participantId: string) => {
    if (!user) return null;

    try {
      // Get user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return null;
      }

      // Try to find existing chat
      const { data: existingChat, error: fetchError } = await (supabase as any)
        .from('chats')
        .select('*')
        .or(`and(participant1_id.eq.${userData.user_id},participant2_id.eq.${participantId}),and(participant1_id.eq.${participantId},participant2_id.eq.${userData.user_id})`)
        .single();

      if (existingChat && !fetchError) {
        return existingChat.chat_id;
      }

      // Create new chat
      const { data: newChat, error: createError } = await (supabase as any)
        .from('chats')
        .insert({
          participant1_id: userData.user_id,
          participant2_id: participantId
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchChats();
      return newChat.chat_id;
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      toast({
        title: "Error",
        description: "Failed to create chat. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, fetchChats, toast]);

  const sendMessage = useCallback(async (chatId: string, content: string) => {
    if (!user) return;

    try {
      // Get user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return;
      }

      const { error } = await (supabase as any)
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userData.user_id,
          content
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const setupRealtimeSubscription = async () => {
      // Get user's internal ID first
      const { data: userData, error: userError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return;
      }

      fetchChats();

      const chatsChannel = supabase
        .channel('chats')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participant1_id=eq.${userData.user_id},participant2_id=eq.${userData.user_id}`
        }, () => {
          fetchChats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(chatsChannel);
      };
    };

    setupRealtimeSubscription();
  }, [user, fetchChats]);

  // Set up messages realtime subscription
  useEffect(() => {
    if (!activeChat) return;

    fetchMessages(activeChat);

    const messagesChannel = supabase
      .channel(`messages-${activeChat}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${activeChat}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [activeChat, fetchMessages]);

  return {
    chats,
    messages,
    activeChat,
    isLoading,
    setActiveChat,
    createOrGetChat,
    sendMessage,
    fetchChats,
    fetchMessages
  };
};
