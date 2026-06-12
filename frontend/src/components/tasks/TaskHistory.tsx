import { TaskHistoryEntry } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { History, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskHistoryProps {
  history: TaskHistoryEntry[];
}

export function TaskHistory({ history }: TaskHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History className="mb-2 h-8 w-8" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="flex gap-3 text-sm">
            <div className="mt-0.5 shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p>
                <span className="font-medium">{entry.user.name}</span>{' '}
                changed <span className="font-medium">{entry.field}</span>
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {entry.oldValue !== null && (
                  <span className="line-through">{entry.oldValue}</span>
                )}
                {entry.oldValue !== null && entry.newValue !== null && (
                  <span>&rarr;</span>
                )}
                {entry.newValue !== null && <span>{entry.newValue}</span>}
              </div>
              {/* Issue #9: Show both relative and exact timestamps */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="mt-1 text-xs text-muted-foreground cursor-default">
                    {formatDistanceToNow(new Date(entry.changedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {format(new Date(entry.changedAt), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
