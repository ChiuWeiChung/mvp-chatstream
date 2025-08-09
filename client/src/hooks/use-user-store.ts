import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

export type User = {
  id: string; // 等於使用者名稱 (唯一)
  name: string; // 與 id 相同
  // socketId: string; // Socket ID 用於管理連線
};

interface UserState {
  user: User | null; // 當前登入的使用者
  setUser: (user: User) => void; // 設置使用者
  clearUser: () => void; // 清除使用者
}

const SESSION_KEY = 'chatstream_user';

// 創建 user store
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,

        // 設置使用者
        setUser: (user) => {
          set({ user });
        },

        // 清除使用者
        clearUser: () => {
          set({ user: null });
        },
      }),
      {
        name: SESSION_KEY,
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);
