// import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu } from '@/components/ui/sidebar';
import { useEffect, useRef } from 'react';
import socket from '@/utilities/socketConnection';
import { NsData } from './types';
import { NamespaceList } from '../namespace-list';
import { MessageSquareDot } from 'lucide-react';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import io, { Socket } from 'socket.io-client';
import { Room } from './types';

// Menu items.

export function AppSidebar() {
  const { resetNamespace, setNamespaces, namespaces, addRoomToNamespace } = useNamespaceStore();
  const namespaceConnectionsRef = useRef<Socket[]>([]);
  
  useEffect(() => {
    socket.emit('clientConnect'); // 通知 ws server， client 已經連線
    socket.on('nsList', (nsData: NsData) => {
      setNamespaces(nsData);
    });

    return () => {
      socket.disconnect();
      resetNamespace();
    };
  }, [resetNamespace, setNamespaces]);

  useEffect(() => {
    // Function to setup namespace listeners
    const setupNamespaceListeners = () => {
      // Clear existing connections
      namespaceConnectionsRef.current.forEach(conn => conn.disconnect());
      namespaceConnectionsRef.current = [];

      // Connect to each namespace to listen for room creation events
      namespaces.forEach((ns) => {
        if (ns.endpoint) {
          const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const nsSocket = io(`${socketUrl}${ns.endpoint}`);
          nsSocket.on('roomCreated', ({ namespaceId, newRoom }: { namespaceId: number; newRoom: Room }) => {
            addRoomToNamespace(namespaceId, newRoom);
          });
          namespaceConnectionsRef.current.push(nsSocket);
        }
      });
    };

    // Setup listeners when namespaces are loaded
    if (namespaces.length > 0) {
      setupNamespaceListeners();
    }
    
    return () => {
      namespaceConnectionsRef.current.forEach(conn => conn.disconnect());
    };
  }, [namespaces, addRoomToNamespace]); // Re-run when namespaces change
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
