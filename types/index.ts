export type UserRole = 'hyper' | 'client_admin' | 'user';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  clientId?: string; // For client_admin and user roles
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

export interface Chatbot {
  id: string;
  clientId: string;
  name: string;
  siteUrl?: string;
  businessName?: string;
  settings: ChatbotSettings;
  createdAt: string;
}

export interface ChatbotSettings {
  welcomeMessage: string;
  responseStyle: 'professional' | 'casual' | 'friendly';
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  customInstructions?: string;
}

export interface MessageSession {
  id: string;
  chatbotId: string;
  clientId: string;
  userId?: string;
  messages: Message[];
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'abandoned';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatReport {
  chatbotId: string;
  chatbotName: string;
  totalSessions: number;
  totalMessages: number;
  averageSessionDuration: number;
  dateRange: {
    start: string;
    end: string;
  };
  sessionsByDay: { date: string; count: number }[];
  messagesByDay: { date: string; count: number }[];
}

