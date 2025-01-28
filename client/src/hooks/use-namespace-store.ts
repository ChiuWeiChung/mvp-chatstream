import { Namespace, Room } from '@/components/app-sidebar/types';
import { create } from 'zustand';

interface NamespaceState {
  namespaces: Namespace[]; // 儲存 namespace 列表
  selectedNamespace: Namespace | null; // 當前選擇的 namespace
  selectedRoom: Room | null; // 當前選擇的 namespace
  selected: {
    namespace: Namespace | null; // 當前選擇的 namespace
    room: Room | null; // 當前選擇的 namespace
  };
  setNamespaces: (namespaces: Namespace[]) => void; // 設置所有 nam
  setCurrent: (state: { room: Room; namespace: Namespace }) => void;
  resetNamespace: () => void; // 重置所選的 namespace
}

// 創建 store
export const useNamespaceStore = create<NamespaceState>((set) => ({
  namespaces: [],
  selected: { namespace: null, room: null },
  selectedNamespace: null,
  selectedRoom: null,

  // 設置 namespace 列表
  setNamespaces: (namespaces) => set({ namespaces }),
  // 選擇當前 namespace & room
  setCurrent: ({ room, namespace }) => set({ selected: { room, namespace } }),
  // 重置目前選擇
  resetNamespace: () => set({ selected: { namespace: null, room: null } }),
}));

