import { StrictModeDroppable } from './StrictModeDroppable';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <h3 className="text-sm font-semibold">{status.name}</h3>
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </div>
      <StrictModeDroppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[120px] flex-1 flex-col gap-2 p-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-muted/50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </div>
  );
}
