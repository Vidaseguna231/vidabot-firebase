
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, DownloadIcon, SirenIcon, AdminDeactivateIcon, ImageIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onExport: () => void;
  onEscalate: () => void;
  onDeactivateAdmin: () => void;
  onImageUpload: (file: File) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; 'aria-label': string }> = ({ onClick, disabled, children, 'aria-label': ariaLabel }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-vida-text-secondary bg-vida-bg-light border border-vida-border rounded-lg hover:bg-vida-border hover:text-vida-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onExport, onEscalate, onDeactivateAdmin, onImageUpload, isLoading, isAdmin }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          const scrollHeight = textareaRef.current.scrollHeight;
          textareaRef.current.style.height = `${scrollHeight}px`;
      }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
      e.target.value = ''; // Reset file input
    }
  };

  const placeholderText = isAdmin
    ? "Admin Mode active. e.g., 'admin: generate-script...'"
    : "Ask about an incident, or describe an image...";

  return (
    <div className="bg-vida-bg-dark p-4 border-t border-vida-border">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-end gap-2 mb-2 px-1">
             {isAdmin && (
                <ActionButton onClick={onDeactivateAdmin} disabled={isLoading} aria-label="Deactivate Admin Mode">
                    <AdminDeactivateIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Deactivate Admin</span>
                </ActionButton>
            )}
            <ActionButton onClick={onExport} disabled={isLoading} aria-label="Export chat transcript">
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Export Transcript</span>
            </ActionButton>
            <ActionButton onClick={onEscalate} disabled={isLoading} aria-label="Escalate incident">
                <SirenIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Escalate</span>
            </ActionButton>
        </div>
        <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
          <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="absolute left-3 bottom-3 text-vida-text-secondary hover:text-vida-text-primary disabled:opacity-50"
              aria-label="Upload image"
          >
              <ImageIcon className="w-6 h-6" />
          </button>
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={isLoading}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            className="flex-1 bg-vida-bg-light border border-vida-border rounded-xl p-3 pl-12 pr-4 text-vida-text-primary placeholder-vida-text-secondary focus:outline-none focus:ring-2 focus:ring-vida-blue resize-none max-h-48"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 flex-shrink-0 bg-vida-blue text-white rounded-full flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
