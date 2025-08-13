import { useCallback, useEffect, useState } from 'react';
import { Params, useParams } from 'react-router';
import { io, Socket } from 'socket.io-client';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import { useNavigate } from 'react-router';
import { Message } from '@/components/sidebar/types';
import { UserIcon } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { User } from '@/lib/auth';
import { socketUrl } from '@/lib/socket';
import Footer from '@/components/footer';
import MessageInput from './chat/message-input';
import LivePlayer from './live-player';
import MessageDialog from './chat/message-dialog';
import { RoomDetail } from './types';

const defaultRoomDetail: RoomDetail = { numUsers: null, history: [], users: [], host: null, isHostInRoom: false, streamCode: undefined };

export const Component = () => {
  const navigate = useNavigate();
  const { namespace, roomId } = useParams<Params>();
  const { user } = useAuthStore();
  const { namespaces, selected, setSelected } = useNamespaceStore();

  const [nsSocket, setNsSocket] = useState<Socket>();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>(defaultRoomDetail);
  const [joinError, setJoinError] = useState<string | null>(null);

  const joinRoom = async (roomTitle: string, namespaceId: number, currentUser: User) => {
    try {
      // 清除舊 socket
      nsSocket?.disconnect();

      const currentNamespace = namespaces.find((ns) => ns.id === namespaceId);
      if (!currentNamespace) throw new Error(`Namespace with id ${namespaceId} not found`);

      const namespaceSocket = io(`${socketUrl}${currentNamespace.endpoint}`);

      const emitRequest = { roomTitle, namespaceId, user: currentUser };
      const ackResponse = await namespaceSocket.emitWithAck('joinRoom', emitRequest);

      if (!ackResponse.success) {
        namespaceSocket.disconnect();
        setJoinError(ackResponse.error || '加入房間失敗');
      } else {
        const { numUsers, history, users, host, isHostInRoom, streamCode } = ackResponse;
        setRoomDetail({
          numUsers: numUsers || 0,
          history: history || [],
          users: users || [],
          host: host || null,
          isHostInRoom: isHostInRoom || false,
          streamCode: streamCode || undefined,
        });

        setJoinError(null); // 清除錯誤訊息
        setNsSocket(namespaceSocket); // 設定當前 namespace socket
      }
    } catch (error) {
      setJoinError('連線失敗，請稍後再試');
      console.error('Join room error:', error);
    }
  };

  const handleStreamCodeUpdate = useCallback((code?: string) => {
    setRoomDetail((prev) => ({ ...prev, streamCode: code }));
  }, []);

  const onMessageSend = (newMessage: string) => {
    if (nsSocket && selected?.namespace && user && selected?.room) {
      const request: Message = {
        userName: user.name,
        date: Date.now(),
        newMessage: newMessage,
        namespaceId: selected.namespace.id,
        roomTitle: selected.room.roomTitle,
        image: user.image || undefined,
      };
      nsSocket.emit('newMessageToRoom', request);
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
        if (user && (isDifferentRoom || isDifferentNamespace || !nsSocket)) {
          joinRoom(foundRoom.roomTitle, foundNs.id, user);
        }
      } else navigate('/notfound');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, roomId, namespaces, navigate, setSelected, user]);

  useEffect(() => {
    if (nsSocket) {
      nsSocket.on('messageToRoom', (newMessage: Message) => {
        // TODO: 可以做 debounce 避免多次渲染
        setRoomDetail((prev) => ({ ...prev, history: [...prev.history, newMessage] }));
      });

      nsSocket.on('roomUsersUpdate', ({ roomUsers, isHostInRoom }: { roomUsers: User[]; isHostInRoom: boolean }) => {
        setRoomDetail((prev) => ({
          ...prev,
          numUsers: roomUsers.length,
          users: roomUsers,
          isHostInRoom: isHostInRoom,
        }));
      });

      return () => {
        // Note: disconnect 會觸發 Server 端 roomUsersUpdate 事件，如果 host 離開，會另外觸發 streamCodeUpdate 事件
        nsSocket.disconnect();
      };
    }
  }, [nsSocket]);

  if (!selected || !user) return null;
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 flex-1 overflow-auto">
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
        {/* 房間基本資訊 */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">主題： {selected.namespace.name.toUpperCase()}</h1>
          <section className="flex items-center gap-2 divide-x divide-muted-foreground [&>p]:pl-2 text-sm">
            <p className="text-muted-foreground">Room: {selected.room.roomTitle}</p>
            <p className="text-primary">Host: {roomDetail.host?.name || '--'}</p>
            <p className="text-primary">房間人數: {roomDetail.numUsers}</p>
          </section>
        </div>

        {/* 房間成員列表 */}
        {roomDetail.users.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-md w-full">
            <h3 className="text-sm font-medium mb-2">房間成員</h3>
            <div className="flex flex-wrap gap-2">
              {roomDetail.users.slice(0, 10).map((roomUser) => (
                <div key={roomUser.id} className="flex items-center gap-2 bg-background px-2 py-1 rounded-md text-xs">
                  <UserIcon className="h-3 w-3" />
                  <span className={roomUser.id === user?.id ? 'font-medium text-primary' : ''}>
                    {roomUser.name}
                    {roomUser.id === user?.id && ' (你)'}
                  </span>
                </div>
              ))}
              {roomDetail.users.length > 10 && <p className="text-sm text-muted-foreground">+ {roomDetail.users.length - 10}</p>}
            </div>
          </div>
        )}
      </div>

      <main className="flex flex-col xl:flex-row gap-4 transition-all flex-1 xl:overflow-hidden">
        {/* 視訊串流 */}
        <LivePlayer
          nsSocket={nsSocket}
          roomDetail={roomDetail}
          namespaceId={selected.namespace.id}
          roomTitle={selected.room.roomTitle}
          userIsHost={!!(roomDetail.host?.id && roomDetail.host.id === user?.id)}
          onStreamCodeUpdate={handleStreamCodeUpdate}
        />

        {/* 聊天室 */}
        <div className="flex-1 h-[20rem] max-h-[20rem] xl:h-auto xl:max-h-[unset] flex flex-col gap-4">
          <MessageDialog messages={roomDetail.history} />
          <MessageInput onMessageSend={onMessageSend} disabled={!user} />
        </div>
      </main>

      <Footer />
    </div>
  );
};
