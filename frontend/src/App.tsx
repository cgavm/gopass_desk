import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@/router/AppRouter';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/auth.store';

function App() {
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
