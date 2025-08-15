import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Namespace } from '@/components/sidebar/types';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/hooks/use-auth-store';
import { User } from '@/lib/auth';
import { toast } from 'sonner';

interface AddRoomDialogProps {
  namespace: Namespace;
  onCreateRoom: (namespaceId: number, roomTitle: string, host: User) => Promise<{ success: boolean; error?: string; room?: { roomId: string } }>;
}

export function AddRoomDialog({ namespace, onCreateRoom }: AddRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const [roomTitle, setRoomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please login first');
      return;
    }

    if (!roomTitle.trim()) {
      setError('Room title is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await onCreateRoom(namespace.id, roomTitle.trim(), user);
      if (result.success && result.room) {
        toast.success(`房間(${roomTitle.trim()})建立成功`);
        setRoomTitle('');
        setOpen(false);
        navigate(`${namespace.endpoint}/${result.room.roomId}`);
      } else {
        setError(result.error || 'Failed to create room');
      }
    } catch (err: unknown) {
      console.error('Error creating room:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setRoomTitle('');
      setError(null);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Plus className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>建立房間</DialogTitle>
          <DialogDescription>
            新增房間到 <strong>{namespace.name}</strong> 頻道。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="roomTitle" className="text-sm font-medium">
                房間名稱
              </label>
              <Input id="roomTitle" placeholder="輸入房間名稱..." value={roomTitle} onChange={(e) => setRoomTitle(e.target.value)} disabled={isCreating} autoFocus />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              取消
            </Button>
            <Button type="submit" disabled={isCreating || !roomTitle.trim()}>
              {isCreating ? '建立中...' : '建立房間'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
