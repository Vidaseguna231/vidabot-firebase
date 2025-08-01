
import React from 'react';
import { Message, Role, MessageType } from '../types';
import { BotIcon, UserIcon, SpeakerIcon, SpeakerOffIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onCopy: (text: string) => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  onToggleTTS: (messageId: string, text: string) => void;
}

const SystemNotification: React.FC<{ text: string }> = ({ text }) => (
    <div className="text-center my-4" role="status">
        <p className="text-xs text-vida-text-secondary italic bg-vida-bg-light px-3 py-1 rounded-full inline-block">
            {text}
        </p>
    </div>
);

const MessageActions: React.FC<{ message: Message, onCopy: (text: string) => void, onFeedback: (id: string, feedback: 'like' | 'dislike') => void, onToggleTTS: (id: string, text: string) => void }> = 
({ message, onCopy, onFeedback, onToggleTTS }) => {
    const hasFeedback = message.feedback !== null && message.feedback !== undefined;
    return (
        <div className="flex items-center gap-2 mt-2 -ml-1">
            <button onClick={() => onToggleTTS(message.id, message.text)} className="p-1 rounded-full hover:bg-vida-border text-vida-text-secondary hover:text-vida-text-primary transition-colors" aria-label={message.isSpeaking ? "Stop listening" : "Listen to message"}>
                {message.isSpeaking ? <SpeakerOffIcon className="w-4 h-4 text-vida-blue" /> : <SpeakerIcon className="w-4 h-4" />}
            </button>
            <button onClick={() => onCopy(message.text)} className="p-1 rounded-full hover:bg-vida-border text-vida-text-secondary hover:text-vida-text-primary transition-colors" aria-label="Copy message">
                <CopyIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onFeedback(message.id, 'like')} disabled={hasFeedback} className="p-1 rounded-full hover:bg-vida-border text-vida-text-secondary hover:text-vida-text-primary transition-colors disabled:opacity-50" aria-label="Like message">
                <ThumbsUpIcon className={`w-4 h-4 ${message.feedback === 'like' ? 'text-vida-blue' : ''}`} />
            </button>
            <button onClick={() => onFeedback(message.id, 'dislike')} disabled={hasFeedback} className="p-1 rounded-full hover:bg-vida-border text-vida-text-secondary hover:text-vida-text-primary transition-colors disabled:opacity-50" aria-label="Dislike message">
                <ThumbsDownIcon className={`w-4 h-4 ${message.feedback === 'dislike' ? 'text-red-500' : ''}`} />
            </button>
        </div>
    );
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCopy, onFeedback, onToggleTTS }) => {
  if (message.type === MessageType.SYSTEM_NOTIFICATION) {
    return <SystemNotification text={message.text} />;
  }

  const isUser = message.role === Role.USER;

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-vida-blue rounded-full flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xl p-4 rounded-2xl flex flex-col ${
          isUser
            ? 'bg-vida-blue text-white rounded-br-none'
            : 'bg-vida-bg-light text-vida-text-primary rounded-bl-none'
        }`}
      >
        {message.imageUrl && (
            <img 
                src={message.imageUrl} 
                alt={isUser ? "Uploaded content" : "Generated content"}
                className="rounded-lg mb-2 max-w-sm max-h-64 object-contain"
            />
        )}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
        {!isUser && message.text && (
            <MessageActions message={message} onCopy={onCopy} onFeedback={onFeedback} onToggleTTS={onToggleTTS} />
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-vida-bg-light rounded-full flex items-center justify-center">
             <UserIcon className="w-5 h-5 text-vida-text-secondary" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;