import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '@/api/projects.api';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FolderKanban, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useSocket } from '@/hooks/useSocket';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isAdmin } = usePermissions();
  const { onProjectCreated } = useSocket();

  const fetchProjects = useCallback(() => {
    setLoading(true);
    projectsApi.list().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Issue #3: Listen for real-time project creation from any user
  useEffect(() => {
    const unsub = onProjectCreated((data: unknown) => {
      const { project } = data as { project: Project };
      setProjects((prev) => {
        // Avoid duplicate if we created it ourselves (already refetched)
        if (prev.some((p) => p.id === project.id)) return prev;
        return [project, ...prev];
      });
    });
    return () => unsub?.();
  }, [onProjectCreated]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await projectsApi.create({
        name: name.trim(),
        description: description || undefined,
      });
      toast.success('Project created');
      setDialogOpen(false);
      setName('');
      setDescription('');
      fetchProjects();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  // Issue #10: Admin delete project
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(`Project "${deleteTarget.name}" deleted`);
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Proyecto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                >
                  Crear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16">
          <FolderKanban className="mb-2 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No projects yet</p>
          <Button
            variant="link"
            onClick={() => setDialogOpen(true)}
            className="mt-2"
          >
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link
                      to={`/projects/${project.id}/board`}
                      className="hover:text-primary"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant={
                        project.status === 'ACTIVE' ? 'default' : 'secondary'
                      }
                    >
                      {project.status}
                    </Badge>
                    {/* Issue #10: Admin delete button */}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget(project);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description ?? 'No description'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{project.members?.length ?? 0} members</span>
                  <span>&middot;</span>
                  <span>{project._count?.tasks ?? 0} tasks</span>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/projects/${project.id}/board`}>
                      Open Board
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Issue #10: Confirm delete dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>"{deleteTarget?.name}"</strong>? This will permanently
              delete all tasks, comments, and history. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
