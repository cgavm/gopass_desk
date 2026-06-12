import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return { user, isAuthenticated, isLoading, logout };
}
