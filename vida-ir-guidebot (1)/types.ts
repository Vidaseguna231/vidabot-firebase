export enum Role {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM_NOTIFICATION = 'system_notification',
}

export interface Message {
  id: string;
  role: Role;
  type: MessageType;
  text: string;
  imageUrl?: string; // For uploaded or generated images
  feedback?: 'like' | 'dislike' | null;
  isSpeaking?: boolean;
}
