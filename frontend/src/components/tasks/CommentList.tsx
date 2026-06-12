import { useState } from 'react';
import { TaskComment } from '@/types';
import { tasksApi } from '@/api/tasks.api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CommentListProps {
  taskId: string;
  comments: TaskComment[];
  onChange: () => void;
}

export function CommentList({ taskId, comments, onChange }: CommentListProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await tasksApi.addComment(taskId, content.trim());
      setContent('');
      onChange();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px] text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleSubmit();
            }}
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={sending || !content.trim()}
          >
            <Send className="mr-1 h-3 w-3" />
            Comment
          </Button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {comment.user.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {comment.user.name}
                  </span>
                  {/* Issue #9: Relative time with exact timestamp tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-default">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        {format(
                          new Date(comment.createdAt),
                          'MMM d, yyyy HH:mm:ss'
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
