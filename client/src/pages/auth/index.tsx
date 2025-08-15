import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoaderIcon, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const { signInWithEmail, signUpWithEmail, isAuthenticated, isLoading, initialize } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailAuthForm, setEmailAuthForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

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