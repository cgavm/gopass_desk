import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, User, TaskPriority } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { tasksApi } from '@/api/tasks.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubtaskList } from './SubtaskList';
import { CommentList } from './CommentList';
import { TaskHistory } from './TaskHistory';
import { format } from 'date-fns';
import {
  User as UserIcon,
  Flag,
  Calendar,
  Tag,
  FolderKanban,
  Trash2,
  Clock,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';

interface TaskDetailProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  statuses: TaskStatus[];
  users: User[];
  onTaskDeleted?: () => void;
  onTaskUpdated?: () => void;
}

const NO_ASSIGNEE = '__none__';

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: 'text-slate-500', label: 'Low' },
  MEDIUM: { color: 'text-blue-500', label: 'Medium' },
  HIGH: { color: 'text-orange-500', label: 'High' },
  CRITICAL: { color: 'text-red-500', label: 'Critical' },
};

export function TaskDetail({
  taskId,
  open,
  onClose,
  statuses,
  users,
  onTaskDeleted,
  onTaskUpdated,
}: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);

  const { isAdmin, userId: currentUserId } = usePermissions();
  const { onTaskUpdated: onSocketTaskUpdated, onTaskMoved } = useSocket();
  const navigate = useNavigate();

  const loadTask = useCallback(() => {
    if (taskId && open) {
      setLoading(true);
      tasksApi
        .get(taskId)
        .then(setTask)
        .finally(() => setLoading(false));
    }
  }, [taskId, open]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  // Issue #3: Auto-refresh task detail when the task is updated or moved via socket
  useEffect(() => {
    if (!open || !taskId) return;

    const unsubUpdated = onSocketTaskUpdated((data: unknown) => {
      const { taskId: updatedId } = data as { taskId: string };
      if (updatedId === taskId) {
        tasksApi.get(taskId).then(setTask);
      }
    });

    const unsubMoved = onTaskMoved((data: unknown) => {
      const { taskId: movedId } = data as { taskId: string };
      if (movedId === taskId) {
        tasksApi.get(taskId).then(setTask);
      }
    });

    return () => {
      unsubUpdated?.();
      unsubMoved?.();
    };
  }, [open, taskId, onSocketTaskUpdated, onTaskMoved]);

  const handleSubtaskChange = () => {
    if (taskId) tasksApi.get(taskId).then(setTask);
  };

  // Issue #3: Change status directly from task detail
  const handleStatusChange = async (newStatusId: string) => {
    if (!task) return;
    setUpdatingStatus(true);
    try {
      await tasksApi.update(task.id, { statusId: newStatusId });
      const updated = await tasksApi.get(task.id);
      setTask(updated);
      toast.success('Status updated');
      // Notify parent (KanbanPage) to re-fetch tasks so the card moves columns
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Issue #2: Assign/reassign from task detail
  const handleAssigneeChange = async (value: string) => {
    if (!task) return;
    const newAssigneeId = value === NO_ASSIGNEE ? null : value;
    setUpdatingAssignee(true);
    try {
      await tasksApi.update(task.id, { assigneeId: newAssigneeId });
      const updated = await tasksApi.get(task.id);
      setTask(updated);
      toast.success('Assignee updated');
    } catch {
      toast.error('Failed to update assignee');
    } finally {
      setUpdatingAssignee(false);
    }
  };

  // Description edit — only reporter or admin can edit, assignee cannot
  const canEditDescription = task
    ? isAdmin || task.reporterId === currentUserId
    : false;

  const handleEditDescription = () => {
    setDescriptionDraft(task?.description ?? '');
    setEditingDescription(true);
  };

  const handleCancelDescription = () => {
    setEditingDescription(false);
    setDescriptionDraft('');
  };

  const handleSaveDescription = async () => {
    if (!task) return;
    setSavingDescription(true);
    try {
      await tasksApi.update(task.id, { description: descriptionDraft || null });
      const updated = await tasksApi.get(task.id);
      setTask(updated);
      setEditingDescription(false);
      toast.success('Description updated');
    } catch {
      toast.error('Failed to update description');
    } finally {
      setSavingDescription(false);
    }
  };

  // Issue #10: Delete task (admin only)
  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await tasksApi.delete(task.id);
      toast.success('Task deleted');
      setShowDeleteConfirm(false);
      onClose();
      onTaskDeleted?.();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const currentStatus = task ? statuses.find((s) => s.id === task.statusId) : null;

  return (
    <>
      {/* Issue #4: Centered dialog with JIRA-like 2-column layout */}
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="w-[90vw] max-w-none sm:max-w-none h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : task ? (
            <>
              {/* Header */}
              <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Issue #8: Project label */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      <span className="font-medium">Project:</span>
                      <span>{task.project?.name}</span>
                    </div>
                    <DialogTitle className="text-xl font-bold leading-tight text-foreground">
                      {task.title}
                    </DialogTitle>
                  </div>
                  {/* Issue #10: Admin delete button */}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Separator className="mt-4" />
              </DialogHeader>

              {/* Body: 2-column layout */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left column: description, tabs */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <Tabs defaultValue="description">
                    <TabsList>
                      <TabsTrigger value="description">
                        Description & Subtasks
                      </TabsTrigger>
                      <TabsTrigger value="comments">
                        Comments ({task.comments.length})
                      </TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="space-y-4 pt-4">
                      {/* Description — editable only by reporter or admin */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Description
                          </span>
                          {canEditDescription && !editingDescription && (
                            <button
                              onClick={handleEditDescription}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                          )}
                        </div>

                        {editingDescription ? (
                          <div className="space-y-2">
                            <Textarea
                              value={descriptionDraft}
                              onChange={(e) => setDescriptionDraft(e.target.value)}
                              placeholder="Describe the task in detail..."
                              className="min-h-[140px] resize-y text-sm"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelDescription}
                                disabled={savingDescription}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveDescription}
                                disabled={savingDescription}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                {savingDescription ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : task.description ? (
                          <div className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-relaxed">
                            {task.description}
                          </div>
                        ) : (
                          <p
                            className={`text-sm italic ${
                              canEditDescription
                                ? 'text-muted-foreground cursor-pointer hover:text-foreground'
                                : 'text-muted-foreground'
                            }`}
                            onClick={canEditDescription ? handleEditDescription : undefined}
                          >
                            {canEditDescription
                              ? 'Click to add a description...'
                              : 'No description provided.'}
                          </p>
                        )}
                      </div>
                      <SubtaskList
                        taskId={task.id}
                        subtasks={task.subtasks}
                        onChange={handleSubtaskChange}
                      />
                    </TabsContent>

                    <TabsContent value="comments" className="pt-4">
                      <CommentList
                        taskId={task.id}
                        comments={task.comments}
                        onChange={handleSubtaskChange}
                      />
                    </TabsContent>

                    <TabsContent value="activity" className="pt-4">
                      <TaskHistory history={task.history} />
                    </TabsContent>
                  </Tabs>
                </div>

                <Separator orientation="vertical" />

                {/* Right column: properties panel */}
                <div className="w-72 shrink-0 overflow-y-auto px-5 py-4 space-y-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </h4>

                  {/* Issue #3: Editable status */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Flag className="h-3.5 w-3.5" />
                      Status
                    </label>
                    <Select
                      value={task.statusId}
                      onValueChange={handleStatusChange}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Flag className="h-3.5 w-3.5" />
                      Priority
                    </label>
                    <span
                      className={`text-sm font-semibold ${
                        PRIORITY_CONFIG[task.priority]?.color ?? ''
                      }`}
                    >
                      {PRIORITY_CONFIG[task.priority]?.label ?? task.priority}
                    </span>
                  </div>

                  {/* Issue #2: Editable assignee */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <UserIcon className="h-3.5 w-3.5" />
                      Assignee
                    </label>
                    <Select
                      value={task.assigneeId ?? NO_ASSIGNEE}
                      onValueChange={handleAssigneeChange}
                      disabled={updatingAssignee}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_ASSIGNEE}>Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reporter */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <UserIcon className="h-3.5 w-3.5" />
                      Reporter
                    </label>
                    <span className="text-sm">{task.reporter.name}</span>
                  </div>

                  <Separator />

                  {/* Dates */}
                  {task.startDate && (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Start Date
                      </label>
                      <span className="text-sm">
                        {format(new Date(task.startDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Due Date
                      </label>
                      <span className="text-sm">
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {/* Issue #9: Created and Updated dates */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      Created
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(task.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      Updated
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(task.updatedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Tag className="h-3.5 w-3.5" />
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Issue #10: Delete confirmation */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(v) => !v && setShowDeleteConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>"{task?.title}"</strong>? This will permanently remove all
              comments, subtasks, and history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Task'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
