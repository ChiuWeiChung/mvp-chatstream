// import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu } from '@/components/ui/sidebar';
import { useEffect } from 'react';
import socket from '@/utilities/socketConnection';
import { NsData } from './types';
import { NamespaceList } from '../namespace-list';
import { MessageSquareDot } from 'lucide-react';
import { useNamespaceStore } from '@/hooks/use-namespace-store';

// Menu items.

export function AppSidebar() {
  const { resetNamespace, setNamespaces, namespaces } = useNamespaceStore();
  useEffect(() => {
    socket.emit('clientConnect'); // 通知 ws server， client 已經連線
    socket.on('nsList', (nsData: NsData) => {
      setNamespaces(nsData);
    });
    
    return () => {
      socket.disconnect();
      resetNamespace();
    };
  }, []);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary-foreground text-primary">
          <MessageSquareDot />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <p className="truncate font-semibold text-primary text-xl">Any Chat App</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{!!namespaces && <NamespaceList namespaces={namespaces} />}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
