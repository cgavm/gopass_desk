import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationsStore } from '@/store/notifications.store';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types';

// Issue #5: Build a human-readable label including the actor's name
function buildNotificationLabel(n: Notification): string {
  const payload = n.payload as Record<string, unknown>;
  const actorName = (payload.actorName as string) ?? 'Someone';
  const taskTitle = (payload.taskTitle as string) ?? 'a task';

  switch (n.type) {
    case 'TASK_ASSIGNED':
      return `${actorName} assigned you to "${taskTitle}"`;
    case 'STATUS_CHANGED':
      return `${actorName} changed the status of "${taskTitle}" to ${payload.newStatus ?? ''}`;
    case 'COMMENT_ADDED':
      return `${actorName} commented on "${taskTitle}"`;
    case 'SUBTASK_CREATED':
      return `${actorName} added a subtask to "${taskTitle}"`;
    default:
      return `New notification on "${taskTitle}"`;
  }
}

// Issue #5: Navigate to the task when clicking a notification
function getNotificationLink(n: Notification): string | null {
  const payload = n.payload as Record<string, unknown>;
  const projectId = payload.projectId as string | undefined;
  const taskId = payload.taskId as string | undefined;
  if (projectId && taskId) {
    return `/projects/${projectId}/board?task=${taskId}`;
  }
  return null;
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    fetch,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    const link = getNotificationLink(n);
    if (link) navigate(link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((n) => {
              const link = getNotificationLink(n);
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b px-4 py-3 last:border-0 transition-colors ${
                    !n.isRead ? 'bg-primary/5' : 'hover:bg-muted/40'
                  } ${link ? 'cursor-pointer' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* Unread indicator dot */}
                  <div className="mt-1.5 shrink-0">
                    {!n.isRead ? (
                      <span className="block h-2 w-2 rounded-full bg-primary" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-transparent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Issue #5: Show actor name and task title */}
                    <p className="text-sm leading-snug">
                      {buildNotificationLabel(n)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
