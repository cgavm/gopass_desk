import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Bot, X, Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useChatStore, DisplayMessage } from '@/store/chat.store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div
      className={cn('flex w-full gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div
          className={cn(
            'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            isError
              ? 'bg-destructive/20 text-destructive'
              : 'bg-primary/20 text-primary'
          )}
        >
          {isError ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : isError
              ? 'rounded-tl-sm border border-destructive/20 bg-destructive/10 text-destructive'
              : 'rounded-tl-sm border border-border/60 bg-card text-card-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3">
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatWidget
// ---------------------------------------------------------------------------
export function ChatWidget() {
  const { isOpen, messages, isLoading, open, close, sendMessage } =
    useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Chat panel                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        id="ai-chat-panel"
        className={cn(
          'fixed bottom-20 left-4 z-50 flex flex-col overflow-hidden rounded-2xl',
          'border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'pointer-events-auto h-[480px] w-[360px] opacity-100 scale-100'
            : 'pointer-events-none h-[480px] w-[360px] opacity-0 scale-95 translate-y-4'
        )}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                GoPass AI
              </p>
              <p className="text-[10px] text-muted-foreground">
                Impulsado por GoPass AI
              </p>
            </div>
          </div>
          <button
            id="ai-chat-close-btn"
            onClick={close}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full',
              'text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
            )}
            aria-label="Cerrar asistente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 scroll-smooth">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/60 bg-background/80 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              id="ai-chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className={cn(
                'max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-border/60',
                'bg-muted/30 px-3 py-2 text-sm leading-relaxed text-foreground',
                'placeholder:text-muted-foreground/60',
                'focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors duration-150'
              )}
            />
            <button
              id="ai-chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                'bg-primary text-primary-foreground',
                'transition-all duration-150',
                'hover:bg-primary/90 hover:scale-105',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100'
              )}
              aria-label="Enviar mensaje"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Floating trigger button                                              */}
      {/* ------------------------------------------------------------------ */}
      <button
        id="ai-chat-trigger-btn"
        onClick={isOpen ? close : open}
        className={cn(
          'fixed bottom-4 left-4 z-50',
          'flex h-12 w-12 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'transition-all duration-300',
          'hover:scale-110 hover:shadow-primary/30 hover:shadow-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen ? 'rotate-[20deg]' : 'rotate-0'
        )}
        aria-label={isOpen ? 'Cerrar asistente de IA' : 'Abrir asistente de IA'}
        title="Asistente de Tareas IA"
      >
        <Bot className="h-5 w-5" />
      </button>
    </>
  );
}
