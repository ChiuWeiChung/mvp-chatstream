import { createBrowserRouter } from 'react-router';
import { Home } from '@/pages/home';
import { Auth } from '@/pages/auth';
import { NotFoundPage } from '@/components/not-found';
import { ProtectedRoute } from '@/components/protected-route';

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
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { path: ':namespace/:roomId', lazy: async () => await import('@/components/room') }, // 動態處理不同聊天室
    ],
  },
]);

export default router;
