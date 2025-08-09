
import { createBrowserRouter } from 'react-router';
import { Home } from '@/pages/home';
import { NotFoundPage } from '@/components/not-found';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement:<NotFoundPage/>,
    children: [
      { path: ':namespace/:roomId', lazy: async () => await import('@/components/room-content') }, // 動態處理不同聊天室
    ],
  },
]);

export default router;
