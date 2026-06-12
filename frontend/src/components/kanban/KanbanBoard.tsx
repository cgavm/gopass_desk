import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types';
import { tasksApi } from '@/api/tasks.api';
import { useSocket } from '@/hooks/useSocket';
import { KanbanColumn } from './KanbanColumn';
import { toast } from 'sonner';

interface KanbanBoardProps {
  projectId: string;
  statuses: TaskStatus[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTasksChange: () => void;
}

export function KanbanBoard({
  projectId,
  statuses,
  tasks,
  onTaskClick,
  onTasksChange,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, Task[]>>({});
  const { joinProject, leaveProject, onTaskMoved } = useSocket();

  // Build columns from tasks
  useEffect(() => {
    const cols: Record<string, Task[]> = {};
    for (const status of statuses) {
      cols[status.id] = tasks
        .filter((t) => t.statusId === status.id)
        .sort((a, b) => a.order - b.order);
    }
    setColumns(cols);
  }, [tasks, statuses]);

  // Socket: join project room
  useEffect(() => {
    joinProject(projectId);
    const unsub = onTaskMoved(() => {
      onTasksChange();
    });
    return () => {
      leaveProject(projectId);
      unsub?.();
    };
  }, [projectId, joinProject, leaveProject, onTaskMoved, onTasksChange]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const { source, destination, draggableId } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const newColumns = { ...columns };
      const sourceCol = [...newColumns[source.droppableId]];
      const destCol =
        source.droppableId === destination.droppableId
          ? sourceCol
          : [...(newColumns[destination.droppableId] ?? [])];

      const [moved] = sourceCol.splice(source.index, 1);
      destCol.splice(destination.index, 0, moved);

      newColumns[source.droppableId] = sourceCol;
      newColumns[destination.droppableId] = destCol;
      setColumns(newColumns);

      try {
        await tasksApi.move(draggableId, {
          statusId: destination.droppableId,
          order: destination.index,
        });
      } catch {
        toast.error('Failed to move task');
        // Revert would need full refresh
        onTasksChange();
      }
    },
    [columns, onTasksChange]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={columns[status.id] ?? []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
