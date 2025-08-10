import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/hooks/use-auth-store';

export const AuthCallback = () => {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  console.log('這裡是 callback 頁面');
  console.log('這裡是 callback 頁面');
  console.log('這裡是 callback 頁面');
  console.log('這裡是 callback 頁面');
  console.log('這裡是 callback 頁面');
  useEffect(() => {
    // 當 callback 頁面載入時，重新初始化 auth 狀態
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在驗證登入...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 如果未登入，重定向到登入頁面
  return <Navigate to="/auth" replace />;
};
