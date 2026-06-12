import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { projectsApi } from '@/api/projects.api';
import { Project, Task } from '@/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Filter,
  ArrowLeft,
  Users,
} from 'lucide-react';

export function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  // Issue #5: Support opening task via URL param ?task=<id>
  const selectedTaskId = searchParams.get('task');
  const setSelectedTaskId = (taskId: string | null) => {
    if (taskId) {
      setSearchParams({ task: taskId });
    } else {
      setSearchParams({});
    }
  };

  const fetchProject = useCallback(() => {
    if (!id) return;
    projectsApi.get(id).then((data) => {
      setProject(data);
    });
  }, [id]);

  const fetchTasks = useCallback(() => {
    if (!id) return;
    projectsApi
      .getTasks(
        id,
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>
      )
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load tasks');
        setLoading(false);
      });
  }, [id, filters]);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [fetchProject, fetchTasks]);

  const uniqueAssignees = Array.from(
    new Set(
      tasks
        .map((t) => t.assigneeId)
        .filter((v): v is string => v !== null && v !== undefined)
    )
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-80" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" onClick={() => navigate('/projects')}>
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{project.status}</Badge>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project.members.length}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => setTaskFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.assignee ?? '__all__'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, assignee: v === '__all__' ? undefined : v }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {uniqueAssignees.map((uid) => {
              const name =
                tasks.find((t) => t.assigneeId === uid)?.assignee?.name ?? uid;
              return (
                <SelectItem key={uid} value={uid}>
                  {name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority ?? '__all__'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, priority: v === '__all__' ? undefined : v }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        projectId={project.id}
        statuses={project.statuses}
        tasks={tasks}
        onTaskClick={setSelectedTaskId}
        onTasksChange={fetchTasks}
      />

      {/* Issue #4: Task Detail as centered Dialog — pass members for assignee selector */}
      <TaskDetail
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        statuses={project.statuses}
        members={project.members}
        onTaskDeleted={fetchTasks}
        onTaskUpdated={fetchTasks}
      />

      {/* Issue #2: Task Form with members for assignee selection */}
      <TaskForm
        projectId={project.id}
        statuses={project.statuses}
        members={project.members}
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
}
