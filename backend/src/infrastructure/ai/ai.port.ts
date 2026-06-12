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

export interface IAIProvider {
  chat(messages: AIMessage[], tools?: FunctionDeclaration[]): Promise<AIResponse>;
}
