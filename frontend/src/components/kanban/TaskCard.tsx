import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-all hover:shadow-md ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
          style={provided.draggableProps.style as React.CSSProperties}
        >
          <div className="mb-2 flex items-start justify-between">
            <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${
                priorityColors[task.priority] ?? 'bg-gray-500'
              }`}
              title={task.priority}
            />
          </div>

          {task.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px]"
                >
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {task.assignee.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}
            </div>
            {task._count && task._count.comments > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
