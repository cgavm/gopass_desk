import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '@/api/projects.api';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'ACTIVE').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold">Tus Proyectos</h2>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12">
          <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No projects yet</p>
          <Link
            to="/projects"
            className="mt-2 text-sm text-primary hover:underline"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/board`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge
                      variant={
                        project.status === 'ACTIVE' ? 'default' : 'secondary'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description ?? 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project._count?.tasks ?? 0} tasks
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
