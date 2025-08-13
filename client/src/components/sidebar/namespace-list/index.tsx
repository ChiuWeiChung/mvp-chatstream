'use client';

import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { NavLink } from 'react-router';
import io from 'socket.io-client';

import { User } from '@/lib/auth';
import { socketUrl } from '@/lib/socket';
import { NsData } from '../types';
import { AddRoomDialog } from '@/components/sidebar/add-room-dialog';

export function NamespaceList({ namespaces }: { namespaces: NsData }) {
  const handleCreateRoom = async (namespaceId: number, roomTitle: string, host: User) => {
    const namespace = namespaces.find((ns) => ns.id === namespaceId);
    if (!namespace?.endpoint) return { success: false, error: 'Namespace not found' };
    // 連線到特定的 namespace
    const namespaceSocket = io(`${socketUrl}${namespace.endpoint}`);
    const { success, error, room } = (await namespaceSocket.emitWithAck('createRoom', { roomTitle, namespaceId, host })) as { success: boolean; error?: string; room: { roomId: string } };
    // 建立房間的動作只需要一次，之後的即時更新會透過其他連線（或其他事件）處理，所以斷開
    namespaceSocket.disconnect();
    if (success) return { success: true, room };
    else return { success: false, error: error || 'Failed to create room' };
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>頻道</SidebarGroupLabel>
      <SidebarMenu>
        {namespaces.map((ns) => (
          // defaultOpen={item.isActive}
          <Collapsible key={ns.id} asChild className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={ns.name} className="h-12">
                  <img src={ns.image} className="w-6 h-full object-contain" />
                  <span className="ml-1">{ns.name}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <AddRoomDialog namespace={ns} onCreateRoom={handleCreateRoom} />
                    <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {ns.rooms?.map((room) => (
                    <SidebarMenuSubItem key={room.roomId}>
                      <SidebarMenuSubButton asChild>
                        <NavLink to={`${ns.endpoint}/${room.roomId}`}>
                          <span>{room.roomTitle}</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
