import { User, Client, Chatbot, MessageSession, ChatReport } from '@/types';
import { hashPassword } from './auth';

// In-memory data store (replace with database in production)
let users: User[] = [];
let clients: Client[] = [];
let chatbots: Chatbot[] = [];
let sessions: MessageSession[] = [];

// Initialize with sample data
let initializing = false;
let initPromise: Promise<void> | null = null;

async function initializeData() {
  if (users.length > 0) return; // Already initialized
  if (initializing && initPromise) return initPromise; // Wait for ongoing initialization
  
  initializing = true;
  initPromise = (async () => {
    try {
      // Create sample clients
      const client1: Client = {
        id: 'client-1',
        name: 'Acme Corporation',
        createdAt: new Date().toISOString(),
      };
      const client2: Client = {
        id: 'client-2',
        name: 'Tech Solutions Inc',
        createdAt: new Date().toISOString(),
      };
      clients = [client1, client2];

      // Create sample users
      const hyperUser: User = {
        id: 'user-hyper',
        email: 'hyper@example.com',
        password: await hashPassword('password123'),
        name: 'Hyper Admin',
        role: 'hyper',
        createdAt: new Date().toISOString(),
      };

      const clientAdmin: User = {
        id: 'user-client-admin',
        email: 'client@example.com',
        password: await hashPassword('password123'),
        name: 'Client Admin',
        role: 'client_admin',
        clientId: 'client-1',
        createdAt: new Date().toISOString(),
      };

      const regularUser: User = {
        id: 'user-regular',
        email: 'user@example.com',
        password: await hashPassword('password123'),
        name: 'Regular User',
        role: 'user',
        clientId: 'client-1',
        createdAt: new Date().toISOString(),
      };

      users = [hyperUser, clientAdmin, regularUser];

      // Create sample chatbots
      const chatbot1: Chatbot = {
        id: 'bot-1',
        clientId: 'client-1',
        name: 'Main Website Chatbot',
        siteUrl: 'https://acme.com',
        businessName: 'Acme Corporation',
        settings: {
          welcomeMessage: 'Hello! How can I help you today?',
          responseStyle: 'professional',
          maxTokens: 1000,
          temperature: 0.7,
          enabled: true,
          customInstructions: 'Be helpful and professional',
        },
        createdAt: new Date().toISOString(),
      };

      const chatbot2: Chatbot = {
        id: 'bot-2',
        clientId: 'client-1',
        name: 'Support Chatbot',
        siteUrl: 'https://support.acme.com',
        businessName: 'Acme Support',
        settings: {
          welcomeMessage: 'Hi! I\'m here to help with support questions.',
          responseStyle: 'friendly',
          maxTokens: 800,
          temperature: 0.8,
          enabled: true,
        },
        createdAt: new Date().toISOString(),
      };

      chatbots = [chatbot1, chatbot2];

      // Create sample sessions
      const session1: MessageSession = {
        id: 'session-1',
        chatbotId: 'bot-1',
        clientId: 'client-1',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello, I need help with my order',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'I\'d be happy to help you with your order. Can you provide your order number?',
            timestamp: new Date(Date.now() - 3590000).toISOString(),
          },
        ],
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        endedAt: new Date(Date.now() - 3000000).toISOString(),
        status: 'completed',
      };

      sessions = [session1];
    } catch (error) {
      console.error('Data initialization error:', error);
      throw error;
    } finally {
      initializing = false;
      initPromise = null;
    }
  })();
  
  return initPromise;
}

// User operations
export async function getUserByEmail(email: string): Promise<User | null> {
  await initializeData();
  return users.find(u => u.email === email) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  await initializeData();
  return users.find(u => u.id === id) || null;
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  await initializeData();
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

export async function getUsersByClientId(clientId: string): Promise<User[]> {
  await initializeData();
  return users.filter(u => u.clientId === clientId);
}

// Client operations
export async function getAllClients(): Promise<Client[]> {
  await initializeData();
  return clients;
}

export async function getClientById(id: string): Promise<Client | null> {
  await initializeData();
  return clients.find(c => c.id === id) || null;
}

export async function createClient(name: string): Promise<Client> {
  await initializeData();
  const newClient: Client = {
    id: `client-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
  };
  clients.push(newClient);
  return newClient;
}

// Chatbot operations
export async function getChatbotsByClientId(clientId: string): Promise<Chatbot[]> {
  await initializeData();
  return chatbots.filter(b => b.clientId === clientId);
}

export async function getChatbotById(id: string): Promise<Chatbot | null> {
  await initializeData();
  return chatbots.find(b => b.id === id) || null;
}

export async function createChatbot(chatbot: Omit<Chatbot, 'id' | 'createdAt'>): Promise<Chatbot> {
  await initializeData();
  const newChatbot: Chatbot = {
    ...chatbot,
    id: `bot-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  chatbots.push(newChatbot);
  return newChatbot;
}

export async function updateChatbot(id: string, updates: Partial<Chatbot>): Promise<Chatbot | null> {
  await initializeData();
  const index = chatbots.findIndex(b => b.id === id);
  if (index === -1) return null;
  chatbots[index] = { ...chatbots[index], ...updates };
  return chatbots[index];
}

export async function deleteChatbot(id: string): Promise<boolean> {
  await initializeData();
  const index = chatbots.findIndex(b => b.id === id);
  if (index === -1) return false;
  chatbots.splice(index, 1);
  return true;
}

// Session operations
export async function getSessionsByClientId(clientId: string): Promise<MessageSession[]> {
  await initializeData();
  return sessions.filter(s => s.clientId === clientId);
}

export async function getSessionsByChatbotId(chatbotId: string): Promise<MessageSession[]> {
  await initializeData();
  return sessions.filter(s => s.chatbotId === chatbotId);
}

export async function getSessionById(id: string): Promise<MessageSession | null> {
  await initializeData();
  return sessions.find(s => s.id === id) || null;
}

// Report operations
export async function getChatReport(chatbotId: string, startDate: string, endDate: string): Promise<ChatReport | null> {
  await initializeData();
  const chatbot = await getChatbotById(chatbotId);
  if (!chatbot) return null;

  const relevantSessions = sessions.filter(
    s => s.chatbotId === chatbotId && 
    s.startedAt >= startDate && 
    s.startedAt <= endDate
  );

  const totalSessions = relevantSessions.length;
  const totalMessages = relevantSessions.reduce((sum, s) => sum + s.messages.length, 0);
  
  const durations = relevantSessions
    .filter(s => s.endedAt)
    .map(s => new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime());
  const averageSessionDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length / 1000 / 60 // in minutes
    : 0;

  // Group by day
  const sessionsByDay: { [key: string]: number } = {};
  const messagesByDay: { [key: string]: number } = {};

  relevantSessions.forEach(session => {
    const date = session.startedAt.split('T')[0];
    sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
    messagesByDay[date] = (messagesByDay[date] || 0) + session.messages.length;
  });

  return {
    chatbotId,
    chatbotName: chatbot.name,
    totalSessions,
    totalMessages,
    averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
    dateRange: { start: startDate, end: endDate },
    sessionsByDay: Object.entries(sessionsByDay).map(([date, count]) => ({ date, count })),
    messagesByDay: Object.entries(messagesByDay).map(([date, count]) => ({ date, count })),
  };
}

