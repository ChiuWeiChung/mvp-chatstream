import { create } from 'zustand';
import { authClient, User, Session } from '@/lib/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      
     
      
      const {data: session} = await authClient.getSession();
      
      if (session) {
        set({
          user: session.user,
          session: session,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      console.error('Auth client baseURL:', 'http://localhost:3001');
      // 即使失敗也要設定 loading 為 false，避免卡在 loading 狀態
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  signInWithGoogle: async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      throw error;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      
      if (error) {
        console.error('Email sign in error:', error);
        throw new Error(error.message);
      }
      
      // 重新初始化以獲取最新的用戶資料
      await get().initialize();
      
      // 認證成功後重新連接 Socket，確保連接狀態正確
      // socketReconnect();
      // socket.connect();
    } catch (error) {
      console.error('Failed to sign in with email:', error);
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string, name: string) => {
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      
      if (error) {
        console.error('Email sign up error:', error);
        throw new Error(error.message);
      }
      
      // 重新初始化以獲取最新的用戶資料
      await get().initialize();
      
      // 認證成功後重新連接 Socket，確保連接狀態正確
      // socketReconnect();
      // socket.connect();
    } catch (error) {
      console.error('Failed to sign up with email:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await authClient.signOut();
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // 登出成功後重定向到登入頁面
      window.location.href = '/auth';
    } catch (error) {
      console.error('Failed to sign out:', error);
      // 即使登出失敗，也清除本地狀態
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      // 強制重定向到登入頁面
      window.location.href = '/auth';
    }
  },
}));
