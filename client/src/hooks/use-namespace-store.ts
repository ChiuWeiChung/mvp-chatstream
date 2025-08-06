import { Namespace, Room } from '@/components/app-sidebar/types';
import { create } from 'zustand';

interface NamespaceState {
  namespaces: Namespace[]; // 儲存 namespace 列表
  selected?: {
    namespace: Namespace; // 當前選擇的 namespace
    room: Room; // 當前選擇的 namespace
  };
  setNamespaces: (namespaces: Namespace[]) => void; // 設置所有 namespace
  setSelected: (state: { room: Room; namespace: Namespace }) => void;
  resetNamespace: () => void; // 重置所選的 namespace
  addRoomToNamespace: (namespaceId: number, room: Room) => void; // 新增房間到指定 namespace
}

// 創建 store
export const useNamespaceStore = create<NamespaceState>((set) => ({
  namespaces: [],
  selected: undefined,

  // 設置 namespace 列表
  setNamespaces: (namespaces) => set({ namespaces }),
  // 選擇當前 namespace & room
  setSelected: ({ room, namespace }) => set({ selected: { room, namespace } }),
  // 重置目前選擇
  resetNamespace: () => set({ selected: undefined }),
  // 新增房間到指定的 namespace
  addRoomToNamespace: (namespaceId, newRoom) => set((state) => ({
    namespaces: state.namespaces.map((namespace) => 
      namespace.id === namespaceId 
        ? { ...namespace, rooms: [...(namespace.rooms || []), newRoom] }
        : namespace
    )
  })),
}));

