'use client';

import { ChevronRight } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { NsData } from '../app-sidebar/types';
import { NavLink } from 'react-router';

export function NamespaceList({ namespaces }: { namespaces: NsData }) {
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
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
