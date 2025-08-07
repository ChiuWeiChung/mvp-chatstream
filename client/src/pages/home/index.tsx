import { Outlet } from 'react-router';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import UserNameModal from '@/components/user-name-modal';
import { User, useUserStore } from '@/hooks/use-user-store';
import { UserIcon } from 'lucide-react';

export const Home = () => {
  const { user, setUser } = useUserStore();

  const handleUserNameSubmit = async (userName: string) => {
    const newUser: User = { id: userName, name: userName };
    setUser(newUser); // 設定當前使用者資料
  };

  return (
    <SidebarProvider>
      <UserNameModal open={!user} onSubmit={handleUserNameSubmit} />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex  items-center gap-2 ml-auto mr-6">
            <UserIcon className="h-4 w-4" />
            {user?.name ?? '--'}
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};
