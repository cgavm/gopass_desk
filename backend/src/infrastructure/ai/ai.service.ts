import { GenerativeModel } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { AIMessage } from './ai.port';
import { chat } from './ai.provider';
import { AI_TOOLS, ToolName } from './ai.tools';
import {
  getTasksForUser,
  getUpcomingTasksForUser,
  getTasksByStatusForUser,
  getAvailableStatusesForUser,
} from './ai.repository';

const MAX_TOOL_ITERATIONS = 3;
const SERVICE_UNAVAILABLE_MESSAGE =
  'El asistente de IA no está disponible en este momento. Por favor, intenta más tarde.';

async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  prisma: PrismaClient,
  userId: string
): Promise<string> {
  switch (name) {
    case 'get_my_tasks': {
      const tasks = await getTasksForUser(prisma, userId);
      return tasks.length > 0
        ? JSON.stringify(tasks)
        : 'No tienes tareas asignadas actualmente.';
    }

    case 'get_upcoming_tasks': {
      const rawDays = args['days'];
      const days = typeof rawDays === 'number' ? rawDays : 7;
      const tasks = await getUpcomingTasksForUser(prisma, userId, days);
      return tasks.length > 0
        ? JSON.stringify(tasks)
        : `No tienes tareas con vencimiento en los próximos ${days} días.`;
    }

    case 'get_tasks_by_status': {
      const rawStatus = args['status_name'];
      const statusName = typeof rawStatus === 'string' ? rawStatus : '';
      const tasks = await getTasksByStatusForUser(prisma, userId, statusName);
      return tasks.length > 0
        ? JSON.stringify(tasks)
        : `No se encontraron tareas con el estado "${statusName}".`;
    }

    case 'get_available_statuses': {
      const statuses = await getAvailableStatusesForUser(prisma, userId);
      return statuses.length > 0
        ? JSON.stringify(statuses)
        : 'No se encontraron estados disponibles para tus tareas.';
    }
  }
}

export interface ChatResult {
  ok: true;
  reply: string;
}

export interface ChatError {
  ok: false;
  message: string;
}

export async function runChat(
  model: GenerativeModel | null,
  prisma: PrismaClient,
  userId: string,
  messages: AIMessage[]
): Promise<ChatResult | ChatError> {
  if (!model) {
    return { ok: false, message: SERVICE_UNAVAILABLE_MESSAGE };
  }

  let response = await chat(model, messages, AI_TOOLS);
  let iterations = 0;

  while (response.toolCalls && response.toolCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
    iterations++;
    const toolCall = response.toolCalls[0];

    const toolResult = await executeTool(
      toolCall.name as ToolName,
      toolCall.arguments,
      prisma,
      userId
    );

    const augmented: AIMessage[] = [
      ...messages,
      { role: 'assistant', content: `[Tool: ${toolCall.name}]` },
      { role: 'user', content: `[Tool result for ${toolCall.name}]: ${toolResult}` },
    ];

    response = await chat(model, augmented);
  }

  return { ok: true, reply: response.content };
}
