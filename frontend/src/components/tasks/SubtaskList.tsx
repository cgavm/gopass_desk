import { useState } from 'react';
import { Subtask } from '@/types';
import { tasksApi } from '@/api/tasks.api';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onChange: () => void;
}

export function SubtaskList({ taskId, subtasks, onChange }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const completedCount = subtasks.filter((s) => s.isCompleted).length;
  const progress =
    subtasks.length === 0 ? 0 : Math.round((completedCount / subtasks.length) * 100);

  const handleToggle = async (subtask: Subtask) => {
    try {
      await tasksApi.updateSubtask(taskId, subtask.id, {
        isCompleted: !subtask.isCompleted,
      });
      onChange();
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await tasksApi.addSubtask(taskId, newTitle.trim());
      setNewTitle('');
      setAdding(false);
      onChange();
    } catch {
      toast.error('Failed to add subtask');
    }
  };

  const handleDelete = async (subtaskId: string) => {
    try {
      await tasksApi.deleteSubtask(taskId, subtaskId);
      onChange();
    } catch {
      toast.error('Failed to delete subtask');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Subtasks</h4>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{subtasks.length} ({progress}%)
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={subtask.isCompleted}
              onCheckedChange={() => handleToggle(subtask)}
            />
            <span
              className={`flex-1 text-sm ${
                subtask.isCompleted ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
              onClick={() => handleDelete(subtask.id)}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <Button size="sm" className="h-8" onClick={handleAdd}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setAdding(false);
              setNewTitle('');
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add subtask
        </Button>
      )}
    </div>
  );
}
