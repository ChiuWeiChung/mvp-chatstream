import { useEffect, useState } from 'react';
import MessageInput from '@/components/message-input';
import MessageDialog from '@/components/message-dialog';
import UserNameModal from '@/components/user-name-modal';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Params, useParams } from 'react-router';
import { io, Socket } from 'socket.io-client';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import { useUserStore, type User } from '@/hooks/use-user-store';
import { useNavigate } from 'react-router';
import { ChatHistoryItem } from '../app-sidebar/types';
import { UserIcon } from 'lucide-react';

interface RoomDetail {
  numUsers: number | null;
  history: ChatHistoryItem[];
  users: User[];
}

export const Component = () => {
  const navigate = useNavigate();
  const { namespace, roomId } = useParams<Params>();
  const { user, setUser } = useUserStore();
  const { namespaces, selected, setSelected } = useNamespaceStore();

  const [nsSocket, setNsSocket] = useState<Socket>();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>({ numUsers: null, history: [], users: [] });
  const [showUserModal, setShowUserModal] = useState(!user);
  const [joinError, setJoinError] = useState<string | null>(null);

  const joinRoom = async (roomTitle: string, namespaceId: number, currentUser: User) => {
    try {
      const currentNamespace = namespaces.find((ns) => ns.id === namespaceId);
      if (!currentNamespace) throw new Error(`Namespace with id ${namespaceId} not found`);

      // 
      console.log('socket host', import.meta.env.VITE_API_URL);
      const socketHost = import.meta.env.VITE_API_URL;
      if (!socketHost) throw new Error('Socket Server Host is not set');
      const namespaceSocket = io(`${socketHost}${currentNamespace.endpoint}`);
      const emitRequest = { roomTitle, namespaceId, user: currentUser };
      const ackResponse = await namespaceSocket.emitWithAck('joinRoom', emitRequest);

      if (!ackResponse.success) {
        namespaceSocket.disconnect();
        setJoinError(ackResponse.error || '加入房間失敗');
      } else {
        const { numUsers, thisRoomHistory, users } = ackResponse;
        setRoomDetail({
          numUsers: numUsers || 0,
          history: thisRoomHistory || [],
          users: users || [],
        });

        setJoinError(null); // 清除錯誤訊息
        setUser(currentUser); // 設定當前使用者資料
        setShowUserModal(false); // 關閉使用者名稱輸入框
        setNsSocket(namespaceSocket); // 設定當前 namespace socket

      }
    } catch (error) {
      setJoinError('連線失敗，請稍後再試');
      console.error('Join room error:', error);
    }
  };

  const onMessageSend = (newMessage: string) => {
    if (nsSocket && selected?.namespace && user) {
      const request: ChatHistoryItem = {
        userName: user.name,
        date: Date.now(),
        newMessage: newMessage,
        selectedNsId: selected.namespace.id,
        // avatar: user.avatar, // TODO  user.avatar feature 待實作
      };
      nsSocket.emit('newMessageToRoom', request);
    }
  };

  const handleUserNameSubmit = async (userName: string) => {
    if (selected) {
      const newUser: User = { id: userName, name: userName };
      await joinRoom(selected.room.roomTitle, selected.namespace.id, newUser);
    }
  };

  // 檢查使用者身份並處理房間加入
  useEffect(() => {
    if (namespaces.length) {
      const foundNs = namespaces.find((ns) => ns.endpoint?.replace('/', '') === namespace);
      const foundRoom = foundNs?.rooms?.find((room) => String(room.roomId) === roomId);
      if (foundRoom && foundNs) {
        setSelected({ namespace: foundNs, room: foundRoom });
        const isDifferentRoom = selected?.room.roomId !== foundRoom.roomId;
        const isDifferentNamespace = selected?.namespace.id !== foundNs.id;
        if (user && (isDifferentRoom || isDifferentNamespace)) {
          joinRoom(foundRoom.roomTitle, foundNs.id, user);
        }
      } else navigate('/notfound');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, roomId, namespaces, navigate, setSelected, user]);


  useEffect(() => {

    if (nsSocket) {
      nsSocket.on('messageToRoom', (newMessage: ChatHistoryItem) => {
        setRoomDetail((prev) => ({ ...prev, history: [...prev.history, newMessage] }));
      });

      nsSocket.on('roomUsersUpdate', (usersInRoom: User[]) => {
        setRoomDetail((prev) => ({
          ...prev,
          numUsers: usersInRoom.length,
          users: usersInRoom,
        }));
      });

      return () => {
        // unmount 時，斷開與 namespace 的連線
        nsSocket.disconnect();
      };
    }
  }, [nsSocket]);


  if (!selected) return null;

  return (
    <>
      <UserNameModal
        open={showUserModal}
        onSubmit={handleUserNameSubmit}
        error={joinError}
        onErrorClear={() => {
          setJoinError(null);
        }}
      />

      <main className="p-4 flex flex-col gap-4 h-[100vh] transition-all flex-1">
        <SidebarTrigger />

        {joinError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md relative">
            <button onClick={() => setJoinError(null)} className="absolute top-2 right-2 text-destructive/70 hover:text-destructive">
              ✕
            </button>
            <p className="text-sm font-medium">加入房間失敗</p>
            <p className="text-xs pr-6">{joinError}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Subject: {selected.namespace.name.toUpperCase()}</h1>
            <section className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Room: {selected.room.roomTitle}</p>
              <p className="text-sm text-primary">Users: {roomDetail.numUsers}</p>
            </section>
          </div>

          {/* 使用者列表 */}
          {roomDetail.users.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-md">
              <h3 className="text-sm font-medium mb-2">房間成員</h3>
              <div className="flex flex-wrap gap-2">
                {roomDetail.users.map((roomUser) => (
                  <div key={roomUser.id} className="flex items-center gap-2 bg-background px-2 py-1 rounded-md text-xs">
                    <UserIcon className="h-3 w-3" />
                    <span className={roomUser.id === user?.id ? 'font-medium text-primary' : ''}>
                      {roomUser.name}
                      {roomUser.id === user?.id && ' (你)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <MessageDialog messages={roomDetail.history} />
        <MessageInput onMessageSend={onMessageSend} disabled={!user} />
      </main>
    </>
  );
};
