import { create } from 'zustand';

export type User = {
  id: string;   // 等於使用者名稱 (唯一)
  name: string; // 與 id 相同
};

interface UserState {
  user: User | null; // 當前登入的使用者
  setUser: (user: User) => void; // 設置使用者
  clearUser: () => void; // 清除使用者
  loadUserFromSession: () => void; // 從 sessionStorage 載入使用者
  saveUserToSession: (user: User) => void; // 儲存使用者到 sessionStorage
}

const SESSION_KEY = 'chatstream_user';

// 創建 user store
export const useUserStore = create<UserState>((set, get) => ({
  user: null,

  // 設置使用者
  setUser: (user) => {
    set({ user });
    get().saveUserToSession(user);
  },

  // 清除使用者
  clearUser: () => {
    set({ user: null });
    sessionStorage.removeItem(SESSION_KEY);
  },

  // 從 sessionStorage 載入使用者
  loadUserFromSession: () => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ user });
      }
    } catch (error) {
      console.error('Failed to load user from session:', error);
      sessionStorage.removeItem(SESSION_KEY);
    }
  },

  // 儲存使用者到 sessionStorage
  saveUserToSession: (user) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to session:', error);
    }
  },
}));