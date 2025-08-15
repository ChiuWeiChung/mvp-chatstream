import { createBrowserRouter } from 'react-router';
import { Home } from '@/pages/home';
import { Auth } from '@/pages/auth';
import { NotFoundPage } from '@/components/not-found';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from '@/components/ui/sonner';


export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Home />
        <Toaster position="top-center" />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { path: ':namespace/:roomId', lazy: async () => await import('@/components/room') }, // 動態處理不同聊天室
    ],
  },
]);

export default router;
