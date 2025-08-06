import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserIcon } from 'lucide-react';

interface UserNameModalProps {
  open: boolean;
  onSubmit: (userName: string) => Promise<void>;
  error?: string | null;
  onErrorClear?: () => void;
}

export default function UserNameModal({ open, onSubmit, error, onErrorClear }: UserNameModalProps) {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) return;
    
    // 清除之前的错误信息
    if (error && onErrorClear) {
      onErrorClear();
    }
    
    setIsLoading(true);
    try {
      await onSubmit(userName.trim());
    } catch (error) {
      console.error('Error submitting user name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
    
    // 当用户重新输入时清除错误信息
    if (error && onErrorClear) {
      onErrorClear();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[425px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            歡迎來到 ChatStream
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="userName" className="text-sm font-medium">
              請輸入您的名稱
            </label>
            <Input
              id="userName"
              type="text"
              placeholder="輸入您的名稱..."
              value={userName}
              onChange={handleInputChange}
              disabled={isLoading}
              autoFocus
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-xs text-destructive">
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              名稱將作為您在聊天室中的身份識別
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!userName.trim() || isLoading}
          >
            {isLoading ? '處理中...' : '確認'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}