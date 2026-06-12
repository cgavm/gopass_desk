import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  Part,
  FunctionDeclaration,
  FunctionCallingMode,
  StartChatParams,
  Tool,
} from '@google/generative-ai';
import { AIMessage, AIResponse } from './ai.port';

function buildSystemInstruction(): string {
  return `Eres un asistente de gestión de tareas para la aplicación gopass_desk.

Tu único propósito es responder preguntas sobre las TAREAS ASIGNADAS al usuario que está preguntando.
Nunca accedes ni mencionas datos de otros usuarios.

COMPORTAMIENTO:
- Responde SIEMPRE en español, de forma clara y concisa.
- Cuando el usuario pregunte sobre sus tareas, usa las herramientas disponibles para obtener datos reales de la base de datos.
- Si el usuario usa términos en español para estados (ej: "revisión", "en progreso", "pendientes", "completadas", "hecho"), mapéalos al término de búsqueda correspondiente antes de llamar get_tasks_by_status.
- Si no hay tareas que coincidan, informa amablemente que no se encontraron resultados.
- No respondas preguntas fuera del ámbito de gestión de tareas.
- Sé empático y profesional en tus respuestas.
- Cuando listes tareas, usa formato claro: título, proyecto, prioridad y fecha de vencimiento si aplica.

MAPEO DE ESTADOS (español → término de búsqueda):
- "pendiente", "por hacer", "to do" → "todo"
- "en progreso", "en curso", "trabajando" → "progress"
- "en revisión", "revisión", "review" → "review"
- "hecho", "completada", "terminada", "done" → "done"

Si no conoces el estado exacto, llama a get_available_statuses primero.`;
}

function splitMessages(messages: AIMessage[]): {
  history: Content[];
  lastUserMessage: string;
} {
  if (messages.length === 0) {
    return { history: [], lastUserMessage: '' };
  }

  const allButLast = messages.slice(0, -1);
  const last = messages[messages.length - 1];

  const history: Content[] = allButLast
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  return { history, lastUserMessage: last?.content ?? '' };
}

export function createGeminiModel(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. ' +
        'The AI assistant cannot start without it.'
    );
  }
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildSystemInstruction(),
  });
}

// ---------------------------------------------------------------------------
// Core chat function (stateless, pure async)
// ---------------------------------------------------------------------------

/**
 * Sends messages to Gemini and returns the model response.
 * If the model requests a tool call, the toolCalls array is populated so
 * the service layer can execute the appropriate repository function.
 */
export async function chat(
  model: GenerativeModel,
  messages: AIMessage[],
  tools?: FunctionDeclaration[]
): Promise<AIResponse> {
  const { history, lastUserMessage } = splitMessages(messages);

  const chatParams: StartChatParams = { history };

  if (tools && tools.length > 0) {
    const toolSet: Tool = { functionDeclarations: tools };
    chatParams.tools = [toolSet];
    chatParams.toolConfig = {
      functionCallingConfig: { mode: FunctionCallingMode.AUTO },
    };
  }

  const session = model.startChat(chatParams);
  const result = await session.sendMessage(lastUserMessage);
  const candidate = result.response.candidates?.[0];

  if (!candidate) {
    return { content: 'No se pudo generar una respuesta. Intenta de nuevo.' };
  }

  const functionCallPart = candidate.content.parts.find(
    (p: Part): p is Part & { functionCall: { name: string; args: Record<string, unknown> } } =>
      'functionCall' in p && p.functionCall !== undefined
  );

  if (functionCallPart) {
    return {
      content: '',
      toolCalls: [
        {
          name: functionCallPart.functionCall.name,
          arguments: functionCallPart.functionCall.args ?? {},
        },
      ],
    };
  }

  return { content: result.response.text() };
}
