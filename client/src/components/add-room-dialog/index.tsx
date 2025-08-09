import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Namespace } from '@/components/app-sidebar/types';
import { User, useUserStore } from '@/hooks/use-user-store';
import { useNavigate } from 'react-router';

interface AddRoomDialogProps {
  namespace: Namespace;
  onCreateRoom: (namespaceId: number, roomTitle: string, host: User) => Promise<{ success: boolean; error?: string; room?: { roomId: string } }>;
}

export function AddRoomDialog({ namespace, onCreateRoom }: AddRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useUserStore();
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
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Add a new room to the <strong>{namespace.name}</strong> channel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="roomTitle" className="text-sm font-medium">
                Room Title
              </label>
              <Input id="roomTitle" placeholder="Enter room title..." value={roomTitle} onChange={(e) => setRoomTitle(e.target.value)} disabled={isCreating} autoFocus />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !roomTitle.trim()}>
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
