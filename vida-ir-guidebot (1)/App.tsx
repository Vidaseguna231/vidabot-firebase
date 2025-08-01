
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { Message, Role, MessageType } from './types';
import { 
  streamChatResponse,
  activateAdmin,
  deactivateAdmin,
  getSignedUploadUrl,
  uploadFile,
} from './services/apiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(!!localStorage.getItem('admin_jwt'));
  const [isPowerUser, setIsPowerUser] = useState<boolean>(false); // This would be driven by Firebase Auth state
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'initial-welcome',
        role: Role.BOT,
        type: MessageType.TEXT,
        text: 'Vida IR-GuideBot online. I am ready to assist with your incident response. How can I help?',
        feedback: null,
      },
    ]);
  }, []);

  useEffect(() => {
    // Cleanup speech synthesis on component unmount to prevent resource leaks
    return () => {
        window.speechSynthesis.cancel();
        if (speechRef.current) {
            speechRef.current.onend = null; // Prevent onend from firing after unmount
        }
    };
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    const systemMessage: Message = {
        id: Date.now().toString(),
        role: Role.SYSTEM,
        type: MessageType.SYSTEM_NOTIFICATION,
        text,
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);
  
  const handleSignIn = useCallback(() => {
    // In a real app, this would trigger Firebase sign-in flow
    setIsPowerUser(true);
    addSystemMessage('Signed in. Power User features enabled.');
  }, [addSystemMessage]);

  const handleSignOut = useCallback(() => {
    // In a real app, this would trigger Firebase sign-out
    setIsPowerUser(false);
    // Also sign out of admin mode if active
    if (isAdmin) {
      handleDeactivateAdmin();
    }
    addSystemMessage('You have been signed out.');
  }, [addSystemMessage, isAdmin]);

  const handleDeactivateAdmin = useCallback(async () => {
    try {
      await deactivateAdmin();
      setIsAdmin(false);
      addSystemMessage('🔒 Admin Mode deactivated. Your session has returned to standard user privileges.');
    } catch (error) {
      console.error("Failed to deactivate admin mode:", error);
      addSystemMessage('Could not deactivate admin mode. Check console for details.');
    }
  }, [addSystemMessage]);
  
  const handleExport = useCallback(() => {
    // This logic would move to the backend to generate a secure download link
    const transcript = messages.filter(m => m.type !== MessageType.SYSTEM_NOTIFICATION);
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vida-ir-transcript-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addSystemMessage('Transcript exported as JSON.');
  }, [messages, addSystemMessage]);

  const handleEscalate = useCallback(() => {
    // This would be a backend call
    addSystemMessage('Escalation protocol initiated. On-call security team notified.');
    // The backend would handle sending notifications and then send this message back
    const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.BOT,
        type: MessageType.TEXT,
        text: 'Acknowledged. For immediate assistance, please call the local Cybercrime unit at +254 20 xxxxxxx. An incident summary has been sent to the pre-configured emergency contacts.',
        feedback: null,
    };
    setMessages(prev => [...prev, botMessage]);
  }, [addSystemMessage]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    addSystemMessage('Copied to clipboard!');
  }, [addSystemMessage]);

  const handleFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    // This would also send feedback to the backend
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));
    addSystemMessage('Thank you for your feedback!');
  }, [addSystemMessage]);

  const handleToggleTTS = useCallback((messageId: string, text: string) => {
      const synth = window.speechSynthesis;
      const isSpeaking = messages.find(m => m.id === messageId)?.isSpeaking;
      
      synth.cancel();

      if (isSpeaking) {
          setMessages(prev => prev.map(m => ({ ...m, isSpeaking: false })));
          return;
      }
      
      speechRef.current = new SpeechSynthesisUtterance(text);
      speechRef.current.onstart = () => {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isSpeaking: true } : { ...m, isSpeaking: false }));
      };
      speechRef.current.onend = () => {
          setMessages(prev => prev.map(m => ({ ...m, isSpeaking: false })));
          speechRef.current = null;
      };
      
      synth.speak(speechRef.current);

  }, [messages]);
  
  const handleSendMessage = useCallback(async (text: string, imageUrl?: string) => {
    const adminCommandMatch = text.match(/^@VidaIRGuideBot admin:\s*(.*)$/);
    if (adminCommandMatch) {
        const command = adminCommandMatch[1].trim();
        const isDeactivate = command === 'deactivate';
        const maskedCommandText = isDeactivate ? text : '@VidaIRGuideBot admin: ****';
        const userMessage: Message = { id: Date.now().toString(), role: Role.USER, type: MessageType.TEXT, text: maskedCommandText };
        setMessages(prev => [...prev, userMessage]);
        
        if (isDeactivate) {
            if (isAdmin) handleDeactivateAdmin(); else addSystemMessage('Admin Mode is not currently active.');
        } else {
            try {
                await activateAdmin(command);
                setIsAdmin(true);
                addSystemMessage('Admin Mode activated. Uncensored defensive guidance is now enabled.');
            } catch (error) {
                console.error(error);
                addSystemMessage('Invalid admin passkey or activation failed.');
            }
        }
        return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: Role.USER, type: MessageType.TEXT, text, imageUrl: imageUrl };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: botMessageId, role: Role.BOT, type: MessageType.TEXT, text: '', feedback: null }]);

    try {
        const stream = await streamChatResponse(text, imageUrl);
        
        let fullResponse = '';
        for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, text: fullResponse } : msg));
        }
    } catch (error) {
        console.error("Error communicating with the AI service:", error);
        const errorMessage = "Sorry, I encountered an error. Please check the application logs.";
        setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, text: errorMessage } : msg));
    } finally {
        setIsLoading(false);
    }
  }, [addSystemMessage, isAdmin, handleDeactivateAdmin]);
  
  const handleImageUpload = async (file: File) => {
    addSystemMessage(`Uploading ${file.name}...`);
    setIsLoading(true);
    try {
      const { signedUrl, publicUrl } = await getSignedUploadUrl(file.name, file.type);
      await uploadFile(signedUrl, file);
      addSystemMessage('Upload complete. Analyzing image...');
      await handleSendMessage('Describe this image.', publicUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
      addSystemMessage('Image upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-vida-bg-dark text-vida-text-primary">
      <Header isAdmin={isAdmin} isPowerUser={isPowerUser} onSignIn={handleSignIn} onSignOut={handleSignOut} />
      <main className="flex-1 flex flex-col pt-24">
        <ChatWindow messages={messages} isLoading={isLoading} onCopy={handleCopy} onFeedback={handleFeedback} onToggleTTS={handleToggleTTS} />
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onExport={handleExport}
          onEscalate={handleEscalate}
          onDeactivateAdmin={handleDeactivateAdmin}
          onImageUpload={handleImageUpload}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
};

export default App;
