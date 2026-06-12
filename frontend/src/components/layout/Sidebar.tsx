import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
];

const adminLinks = [
  { to: '/admin', label: 'Admin Dashboard', icon: Shield },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { isAdmin } = usePermissions();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <span className="text-lg font-bold tracking-tight">gopass_desk</span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 hover:bg-accent"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {userLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              location.pathname === link.to
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            )}
          >
            <link.icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{link.label}</span>}
          </Link>
        ))}

        {isAdmin && (
          <>
            {sidebarOpen && (
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  Administration
                </p>
              </div>
            )}
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
