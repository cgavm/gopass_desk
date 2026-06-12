import { useAuthStore } from '@/store/auth.store';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  return {
    isAdmin: user?.role === 'ADMIN',
    isUser: user?.role === 'USER',
    role: user?.role,
    userId: user?.id,
  };
}
