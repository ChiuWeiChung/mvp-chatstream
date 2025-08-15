import { Namespace, Room } from '@/components/sidebar/types';
import { create } from 'zustand';

interface NamespaceState {
  namespaces: Namespace[]; // 儲存 namespace 列表
  setNamespaces: (namespaces: Namespace[]) => void; // 設置所有 namespace
  addRoomToNamespace: (props: { namespaceId: number; newRoom: Room }) => void; // 新增房間到指定 namespace
}

// 創建 store
export const useNamespaceStore = create<NamespaceState>((set) => ({
  namespaces: [],
  // 設置 namespace 列表
  setNamespaces: (namespaces) => set({ namespaces }),
  // 新增房間到指定的 namespace
  addRoomToNamespace: ({ namespaceId, newRoom }) =>
    set((state) => ({
      namespaces: state.namespaces.map((namespace) => (namespace.id === namespaceId ? { ...namespace, rooms: [...(namespace.rooms || []), newRoom] } : namespace)),
    })),
}));
