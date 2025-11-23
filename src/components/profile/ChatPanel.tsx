
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, type Chat, type Message } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialChatWithUser?: string; // User ID to start chat with
}

const ChatList: React.FC<{
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  isLoading: boolean;
}> = ({ chats, onSelectChat, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          💬
        </div>
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a conversation from a trader's profile</p>
      </div>
    );
  }

  return (
    <div>
      {chats.map((chat) => (
        <div
          key={chat.chat_id}
          className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onSelectChat(chat.chat_id)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.other_participant?.profile_picture_url} />
              <AvatarFallback>
                {chat.other_participant?.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm truncate">
                  {chat.other_participant?.first_name && chat.other_participant?.last_name
                    ? `${chat.other_participant.first_name} ${chat.other_participant.last_name}`
                    : `@${chat.other_participant?.username}`
                  }
                </p>
                {chat.last_message_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              {chat.last_message && (
                <p className="text-sm text-muted-foreground truncate">
                  {chat.last_message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatView: React.FC<{
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack: () => void;
  currentUserId: string;
}> = ({ chat, messages, onSendMessage, onBack, currentUserId }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src={chat.other_participant?.profile_picture_url} />
          <AvatarFallback>
            {chat.other_participant?.username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <p className="font-medium text-sm">
            {chat.other_participant?.first_name && chat.other_participant?.last_name
              ? `${chat.other_participant.first_name} ${chat.other_participant.last_name}`
              : `@${chat.other_participant?.username}`
            }
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  initialChatWithUser 
}) => {
  const { user } = useAuth();
  const { 
    chats, 
    messages, 
    activeChat, 
    isLoading, 
    setActiveChat, 
    createOrGetChat, 
    sendMessage 
  } = useChat();
  const [showChatList, setShowChatList] = useState(true);

  // Handle initial chat creation
  useEffect(() => {
    if (initialChatWithUser && isOpen) {
      createOrGetChat(initialChatWithUser).then((chatId) => {
        if (chatId) {
          setActiveChat(chatId);
          setShowChatList(false);
        }
      });
    }
  }, [initialChatWithUser, isOpen, createOrGetChat, setActiveChat]);

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setActiveChat(null);
    setShowChatList(true);
  };

  const handleSendMessage = async (content: string) => {
    if (activeChat) {
      await sendMessage(activeChat, content);
    }
  };

  const currentChat = chats.find(c => c.chat_id === activeChat);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Mobile backdrop */}
      <div className="lg:hidden fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl
        lg:relative lg:w-96 lg:max-w-none
        transform transition-transform duration-300 ease-in-out z-10
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {showChatList || !activeChat ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
              <ChatList
                chats={chats}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
              />
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Chat View Header - only show close on desktop */}
            <div className="hidden lg:flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat View */}
            <div className="h-full lg:h-[calc(100vh-80px)]">
              <ChatView
                chat={currentChat || null}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={handleBackToList}
                currentUserId={user?.id || ''}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
