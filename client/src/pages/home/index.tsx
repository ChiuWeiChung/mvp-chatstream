import { Outlet } from 'react-router';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/use-auth-store';
import { UserIcon, LogOut } from 'lucide-react';

export const Home = () => {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut(); // auth store 會處理重定向和錯誤
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-[100vh]">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex items-center gap-2 ml-auto mr-6">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">{user?.name || user?.email || '--'}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 h-8 w-8 p-0" title="登出">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};
