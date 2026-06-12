import { FunctionDeclaration } from '@google/generative-ai';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  toolCalls?: AIToolCall[];
}

/**
 * IAIProvider — adapter interface that decouples the chat logic from the
 * concrete model implementation.
 *
 * Tools are typed as FunctionDeclaration (Gemini SDK) since this is the
 * canonical definition of a callable tool and avoids lossy re-mapping.
 */
export interface IAIProvider {
  chat(messages: AIMessage[], tools?: FunctionDeclaration[]): Promise<AIResponse>;
}
