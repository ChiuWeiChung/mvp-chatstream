'use client';

import { ChevronRight } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { NsData } from '../app-sidebar/types';
import { NavLink } from 'react-router';
import { AddRoomDialog } from '../add-room-dialog';
import io from 'socket.io-client';
import { User } from '@/hooks/use-user-store';
import { socketUrl } from '@/utilities/socketConnection';

export function NamespaceList({ namespaces }: { namespaces: NsData }) {
  const handleCreateRoom = async (namespaceId: number, roomTitle: string, host: User): Promise<{ success: boolean; error?: string; room?: { roomId: string } }> => {
    return new Promise((resolve) => {
      const namespace = namespaces.find(ns => ns.id === namespaceId);
      if (!namespace?.endpoint) {
        resolve({ success: false, error: 'Namespace not found' });
        return;
      }

      // Connect to the specific namespace
      const namespaceSocket = io(`${socketUrl}${namespace.endpoint}`);
      
      namespaceSocket.emit('createRoom', { roomTitle, namespaceId, host }, (response: { success: boolean; error?: string; room: { roomId :string;} }) => {
        if (response.success ) {
          // The real-time update will be handled by the 'roomCreated' event
          resolve({ success: true, room: response.room });
        } else {
          resolve({ success: false, error: response.error });
        }
        namespaceSocket.disconnect();
      });
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Channel</SidebarGroupLabel>
      <SidebarMenu>
        {namespaces.map((ns) => (
          // defaultOpen={item.isActive}
          <Collapsible key={ns.id} asChild className="group/collapsible">
            <SidebarMenuItem >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={ns.name} className='h-12' >
                  <img src={ns.image} className="w-6 h-full object-contain" />
                  <span className='ml-1'>{ns.name}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <AddRoomDialog namespace={ns} onCreateRoom={handleCreateRoom} />
                    <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </div>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {ns.rooms?.map((room) => (
                    // add bg-red style to sidbarMenuSubItem when anchor tag (navLink) has active class

                    <SidebarMenuSubItem key={room.roomId} className=" peer-checked:bg-red">
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
