import { api } from './client';
import { AxiosError } from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  statusCode: number;
}

export class AIServiceUnavailableError extends Error {
  constructor() {
    super(
      'El asistente de IA no está disponible en este momento. ' +
        'Por favor, intenta más tarde.'
    );
    this.name = 'AIServiceUnavailableError';
  }
}

export const aiApi = {
  /**
   * Sends the full conversation history to the backend and returns the AI reply.
   * Throws AIServiceUnavailableError on 503 so the UI can display a friendly message.
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await api.post<ChatResponse>('/ai/chat', { messages });
      return response.data.reply;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;

      if (
        axiosError.response?.status === 503 ||
        axiosError.response?.status === 501
      ) {
        throw new AIServiceUnavailableError();
      }

      // Re-throw for generic error handling in the store
      throw err;
    }
  },
};
