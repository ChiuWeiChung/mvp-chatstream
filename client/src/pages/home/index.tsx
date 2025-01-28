import { Outlet } from 'react-router';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export const Home = () => {
  return (
      <SidebarProvider>
        <AppSidebar />
        <Outlet />
      </SidebarProvider>
  );
};
