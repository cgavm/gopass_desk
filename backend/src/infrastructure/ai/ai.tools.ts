import {
  FunctionDeclaration,
  FunctionDeclarationSchema,
  SchemaType,
} from '@google/generative-ai';

/** Typed argument shapes for each tool, used in the service executor. */
export interface GetUpcomingTasksArgs {
  days?: number;
}

export interface GetTasksByStatusArgs {
  status_name: string;
}

export type ToolName =
  | 'get_my_tasks'
  | 'get_upcoming_tasks'
  | 'get_tasks_by_status'
  | 'get_available_statuses';

/** Empty parameters schema for tools that take no arguments. */
const noParams: FunctionDeclarationSchema = {
  type: SchemaType.OBJECT,
  properties: {},
};

export const AI_TOOLS: FunctionDeclaration[] = [
  {
    name: 'get_my_tasks',
    description:
      'Retrieves all tasks currently assigned to the authenticated user. ' +
      'Returns title, project, status, priority, and due date for each task. ' +
      'Use this when the user asks for their task list, workload overview, or tasks by priority.',
    parameters: noParams,
  },
  {
    name: 'get_upcoming_tasks',
    description:
      'Retrieves tasks assigned to the authenticated user that are due within a given number of days. ' +
      'Use this when the user asks what is due soon, what expires this week, or similar urgency questions.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: {
          type: SchemaType.NUMBER,
          description:
            'Number of calendar days to look ahead (e.g., 7 for one week). Defaults to 7 if not specified.',
        },
      },
    },
  },
  {
    name: 'get_tasks_by_status',
    description:
      'Retrieves tasks assigned to the authenticated user that belong to a specific status. ' +
      'The user may ask in Spanish (e.g., "revisión", "en progreso", "pendientes", "hecho"). ' +
      'Pass the most likely status keyword to search for. The search is case-insensitive and partial.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status_name: {
          type: SchemaType.STRING,
          description:
            'The status name or keyword to filter by. ' +
            'Examples: "review", "in_review", "done", "todo", "progress". ' +
            'Can be a partial match.',
        },
      },
      required: ['status_name'],
    },
  },
  {
    name: 'get_available_statuses',
    description:
      'Returns the list of distinct status names that appear across all tasks assigned to the user. ' +
      'Call this first if you are unsure which statuses exist before filtering by status.',
    parameters: noParams,
  },
];
