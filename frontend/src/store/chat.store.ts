import { create } from 'zustand';
import { aiApi, ChatMessage, AIServiceUnavailableError } from '@/api/ai.api';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

interface ChatState {
  isOpen: boolean;
  messages: DisplayMessage[];
  isLoading: boolean;

  open: () => void;
  close: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy Goomie tu asistente de tareas 👋 Puedo ayudarte a consultar tus tareas asignadas, ver cuáles se vencen pronto, o filtrar por estado. ¿En qué te puedo ayudar?',
  timestamp: new Date(),
};

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,

  open: () => {
    set({
      isOpen: true,
      messages: [{ ...WELCOME_MESSAGE, timestamp: new Date() }],
    });
  },

  close: () => {
    set({ isOpen: false, messages: [], isLoading: false });
  },

  clearMessages: () => {
    set({ messages: [{ ...WELCOME_MESSAGE, timestamp: new Date() }] });
  },

  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || get().isLoading) return;

    // Append user message
    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    // Build history for the API (only user/assistant roles, skip 'error' and 'welcome')
    const currentMessages = get().messages;
    const historyForApi: ChatMessage[] = currentMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    try {
      const reply = await aiApi.chat(historyForApi);

      const assistantMessage: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err) {
      const errorContent =
        err instanceof AIServiceUnavailableError
          ? err.message
          : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';

      const errorMessage: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: errorContent,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },
}));
