import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoaderIcon, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isAuthenticated, isLoading, initialize } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailAuthForm, setEmailAuthForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      let message = '登入失敗';
      if (err instanceof Error) message = err.message;
      setError(message);
    }
  };

  const handleEmailAuth =async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const { email, password, name } = emailAuthForm;
      if (isSignUp) await signUpWithEmail(email, password, name);
      else await signInWithEmail(email, password);
    } catch (err) {
      let message = `${isSignUp ? '註冊' : '登入'}失敗`;
      if (err instanceof Error) message = err.message;
      setError(message);
    }
  };

  const handleEmailAuthFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailAuthForm({ ...emailAuthForm, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    initialize(); // 初始化 auth 狀態
  }, [initialize]);

  // 如果已經登入，redirect 到首頁
  if (isAuthenticated) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="animate-spin w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{isSignUp ? '註冊' : '登入'}到 SockStream</h2>
          <p className="mt-2 text-sm text-gray-600">{isSignUp ? '創建新帳戶開始聊天' : '登入您的帳戶繼續聊天'}</p>
        </div>

        <div className="space-y-6">
          {/* Google OAuth 按鈕 */}
          <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            使用 Google 登入
          </Button>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">或</span>
            </div>
          </div>

          {/* Email/Password 表單 */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <Input id="name" type="text" name="name" value={emailAuthForm.name} onChange={handleEmailAuthFormChange} required placeholder="輸入您的姓名" className="mt-1" />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <Input id="email" type="email" name="email" value={emailAuthForm.email} onChange={handleEmailAuthFormChange} required placeholder="輸入您的電子郵件" className="mt-1" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <Input id="password" type="password" name="password" value={emailAuthForm.password} onChange={handleEmailAuthFormChange} required placeholder="輸入您的密碼" className="mt-1" />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2">
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isLoading ? '處理中...' : isSignUp ? '註冊' : '登入'}
            </Button>
          </form>

          <div className="text-center">
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-600 hover:text-blue-500">
              {isSignUp ? '已有帳戶？點此登入' : '沒有帳戶？點此註冊'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;