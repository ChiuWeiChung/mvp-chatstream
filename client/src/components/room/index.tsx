import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Params, useParams } from 'react-router';
import { io, Socket } from 'socket.io-client';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import { Message } from '@/components/sidebar/types';
import { UserIcon } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { User } from '@/lib/auth';
import { socketUrl } from '@/lib/socket';
import Footer from '@/components/footer';
import MessageInput from './chat/message-input';
import LivePlayer from './live-player';
import MessageDialog from './chat/message-dialog';
import { EmitJoinRoomResponse, RoomDetail } from './types';

export const Component = () => {
  const { namespace, roomId } = useParams<Params>();
  const { user } = useAuthStore();
  const { namespaces } = useNamespaceStore();
  const [nsSocket, setNsSocket] = useState<Socket>();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>();
  const [joinError, setJoinError] = useState<string | null>(null);

  // 當前 namespace & room
  const current = useMemo(() => {
    const foundNs = namespaces.find((ns) => ns.endpoint?.replace('/', '') === namespace);
    const foundRoom = foundNs?.rooms?.find((room) => String(room.roomId) === roomId);
    if (!foundRoom || !foundNs) return null;
    return { namespace: foundNs, room: foundRoom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, roomId]); // 

  const joinRoom = useCallback(
    async (request: { endpoint: string; namespaceId: number; roomTitle: string }) => {
      try {
        const { endpoint, namespaceId, roomTitle } = request;
        const namespaceSocket = io(`${socketUrl}${endpoint}`);
        const emitRequest = { roomTitle, namespaceId, user };
        const ackResponse = (await namespaceSocket.emitWithAck('joinRoom', emitRequest)) as EmitJoinRoomResponse;
        
        if (!ackResponse.success) {
          namespaceSocket.disconnect();
          setJoinError(ackResponse.error || '加入房間失敗');
        } else {
          setRoomDetail({ ...ackResponse, roomTitle });
          setJoinError(null); // 清除錯誤訊息
          setNsSocket(namespaceSocket); // 設定當前 namespace socket
        }
      } catch (error) {
        setJoinError('連線失敗，請稍後再試');
        console.error('Join room error:', error);
      }
    },
    [user],
  );

  const onMessageSend = (newMessage: string) => {
    if (nsSocket && current && user) {
      const request: Message = {
        userName: user.name,
        date: Date.now(),
        newMessage: newMessage,
        namespaceId: current.namespace.id,
        roomTitle: current.room.roomTitle,
        image: user.image || undefined,
      };
      nsSocket.emit('newMessageToRoom', request);
    }
  };

  // 停止直播
  const stopStreamingHandler = async () => {
    if (nsSocket && roomDetail && current) {
      const ackResponse = await nsSocket.emitWithAck('stopStreaming', { namespaceId: current.namespace.id, roomTitle: roomDetail.roomTitle });
      if (!ackResponse.success) console.error('Stop streaming error:', ackResponse.error);
    }
  };

  // 檢查使用者身份並處理房間加入
  useEffect(() => {
    if (current) {
      joinRoom({
        endpoint: current.namespace.endpoint,
        namespaceId: current.namespace.id,
        roomTitle: current.room.roomTitle,
      });
    }
  }, [current, joinRoom]);

  useEffect(() => {
    if (nsSocket) {
      nsSocket.on('messageToRoom', (newMessage: Message) => {
        // TODO: 可以做 debounce 避免多次渲染
        setRoomDetail((prev) =>{
          if(!prev) return prev;
          return { ...prev, history: [...prev.history, newMessage] };
        });
      });

      nsSocket.on('roomUsersUpdate', ({ roomUsers, isHostInRoom }: { roomUsers: User[]; isHostInRoom: boolean }) => {
        setRoomDetail((prev) =>{
          if(!prev) return prev;
          return {
            ...prev,
            numUsers: roomUsers.length,
            users: roomUsers,
            isHostInRoom: isHostInRoom,
          }
        });
      });

      nsSocket.on('streamCodeUpdate', (code?: string) => {
        setRoomDetail((prev) => {
          if (!prev) return prev;
          return { ...prev, streamCode: code };
        });
      });

      return () => {
        nsSocket.disconnect();
      };
    }
  }, [nsSocket]);

  if (!user) return <Navigate to="/auth" replace />;
  if (!current) return <Navigate to="/not-found" replace />;
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
          <h1 className="text-2xl font-bold">主題： {current.namespace.name.toUpperCase()}</h1>
          <section className="flex items-center gap-2 divide-x divide-muted-foreground [&>p]:pl-2 text-sm">
            <p className="text-muted-foreground">Room: {current.room.roomTitle}</p>
            <p className="text-primary">Host: {roomDetail?.host.name || '--'}</p>
            <p className="text-primary">房間人數: {roomDetail?.numUsers || '--'}</p>
          </section>
        </div>

        {/* 房間成員列表 */}
        {!!roomDetail?.users.length && (
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
        {!!roomDetail && (
          <LivePlayer
            roomDetail={roomDetail}
            namespaceId={current.namespace.id}
            userIsHost={!!(roomDetail.host.id === user.id)}
            stopStreamingHandler={stopStreamingHandler}
          />
        )}

        {/* 聊天室 */}
        <div className="flex-1 h-[20rem] max-h-[20rem] xl:h-auto xl:max-h-[unset] flex flex-col gap-4">
          <MessageDialog messages={roomDetail?.history || []} />
          <MessageInput onMessageSend={onMessageSend} disabled={!user} />
        </div>
      </main>

      <Footer />
    </div>
  );
};
