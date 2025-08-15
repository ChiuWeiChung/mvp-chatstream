import { createBrowserRouter } from 'react-router';
import Layout from '@/pages/layout';
import Auth from '@/pages/auth';
import { NotFoundPage } from '@/components/not-found';
import { ProtectedRoute } from '@/components/protected-route';
import { Toaster } from '@/components/ui/sonner';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
        <Toaster position="top-center" />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        id: 'landing-page',
        index: true, // 預設首頁
        lazy: async () => await import('@/pages/landing'),
      },
      {
        id: 'room',
        path: ':namespace/:roomId',
        lazy: async () => await import('@/components/room'),
        hydrateFallbackElement: <></>,
      },
    ],
  },
]);

export default router;
