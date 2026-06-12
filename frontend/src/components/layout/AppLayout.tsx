import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/sonner';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { ChatWidget } from '@/components/chat/ChatWidget';

export function AppLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" />
      {/* AI Chat assistant — fixed overlay, only visible to authenticated users */}
      <ChatWidget />
    </div>
  );
}
