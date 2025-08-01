
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import { BotIcon } from './Icons';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onCopy: (text: string) => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  onToggleTTS: (messageId: string, text: string) => void;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 my-4 justify-start">
        <div className="w-8 h-8 flex-shrink-0 bg-vida-blue rounded-full flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
        </div>
        <div className="max-w-sm p-4 rounded-2xl bg-vida-bg-light rounded-bl-none">
            <div className="flex items-center justify-center space-x-1">
                <span className="w-2 h-2 bg-vida-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-vida-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-vida-text-secondary rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onCopy, onFeedback, onToggleTTS }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="container mx-auto max-w-4xl">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onCopy={onCopy} onFeedback={onFeedback} onToggleTTS={onToggleTTS} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;