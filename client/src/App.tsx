import { RouterProvider } from 'react-router';
import { router } from '@/configs/routes';

const App = () => {
  return (
      <RouterProvider router={router} />
  );
};

export default App;
