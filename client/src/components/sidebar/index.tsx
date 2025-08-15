import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu } from '@/components/ui/sidebar';
import { useEffect, useRef } from 'react';
import { NsData } from './types';
import { NamespaceList } from './namespace-list';
import { MessageSquareDot } from 'lucide-react';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import io, { Socket } from 'socket.io-client';
import { Link } from 'react-router';
import { socketUrl, getSocket } from '@/lib/socket';

export default function SockStreamSidebar() {
  const { setNamespaces, namespaces, addRoomToNamespace } = useNamespaceStore();
  const namespaceConnectionsRef = useRef<Socket[]>([]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('clientConnect'); // 通知 ws server， client 已經連線
    socket.on('nsList', (nsData: NsData) => {
      setNamespaces(nsData);
    });
  }, [setNamespaces]);

  useEffect(() => {
    // 設定 namespace 的 listeners，處裡每個 namespace 的 roomCreated 事件
    const setupNamespaceListeners = () => {
      namespaceConnectionsRef.current.forEach((conn) => conn.disconnect());
      namespaceConnectionsRef.current = [];

      namespaces.forEach((ns) => {
        if (ns.endpoint) {
          const nsSocket = io(`${socketUrl}${ns.endpoint}`);
          nsSocket.on('roomCreated', addRoomToNamespace);
          namespaceConnectionsRef.current.push(nsSocket);
        }
      });
    };

    // Setup listeners when namespaces are loaded
    if (namespaces.length > 0) setupNamespaceListeners();

    return () => {
      namespaceConnectionsRef.current.forEach((conn) => conn.disconnect());
    };
  }, [namespaces, addRoomToNamespace]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary-foreground text-primary">
          <MessageSquareDot />
        </div>
        <Link to="/">
          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="truncate font-semibold text-primary text-xl">SockStream</p>
          </div>
        </Link>
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
