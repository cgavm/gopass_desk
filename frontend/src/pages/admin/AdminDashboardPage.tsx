import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { AdminStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  ClipboardList,
  Users,
  UserCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load admin stats
      </div>
    );
  }

  const activeRate =
    stats.totalUsers === 0
      ? 0
      : Math.round((stats.activeUsers / stats.totalUsers) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats.totalProjects}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats.totalTasks}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats.totalUsers}</span>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="h-3 w-3" />
              {stats.activeUsers} active ({activeRate}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-red-500">
              {stats.overdueTasks}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Task Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasks by Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.tasksByStatus.map((item) => (
              <div key={item.priority} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.priority}</span>
                  <span className="font-medium">{item._count}</span>
                </div>
                <Progress
                  value={
                    stats.totalTasks === 0
                      ? 0
                      : Math.round((item._count / stats.totalTasks) * 100)
                  }
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project._count.tasks} tasks &middot;{' '}
                    {formatDistanceToNow(new Date(project.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Badge variant="outline">{project.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
