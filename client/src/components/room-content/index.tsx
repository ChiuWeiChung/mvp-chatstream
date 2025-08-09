import { useEffect,  useState } from 'react';
import MessageInput from '@/components/message-input';
import MessageDialog from '@/components/message-dialog';
// import UserNameModal from '@/components/user-name-modal';
import { Params, useParams } from 'react-router';
import { io, Socket } from 'socket.io-client';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import { useUserStore, type User } from '@/hooks/use-user-store';
import { useNavigate } from 'react-router';
import { ChatHistoryItem } from '../app-sidebar/types';
import { UserIcon } from 'lucide-react';
import VideoStream from '../video-stream';

interface RoomDetail {
  numUsers: number | null;
  history: ChatHistoryItem[];
  users: User[];
  host: User | null;
}

export const Component = () => {
  const navigate = useNavigate();
  const { namespace, roomId } = useParams<Params>();
  const { user } = useUserStore();
  const { namespaces, selected, setSelected } = useNamespaceStore();

  const [nsSocket, setNsSocket] = useState<Socket>();
  const [roomDetail, setRoomDetail] = useState<RoomDetail>({ numUsers: null, history: [], users: [], host: null });
  const [joinError, setJoinError] = useState<string | null>(null);

  const joinRoom = async (roomTitle: string, namespaceId: number, currentUser: User) => {
    try {
      // 清除舊 socket
      nsSocket?.disconnect();

      const currentNamespace = namespaces.find((ns) => ns.id === namespaceId);
      if (!currentNamespace) throw new Error(`Namespace with id ${namespaceId} not found`);

      const socketHost = import.meta.env.VITE_API_URL;
      if (!socketHost) throw new Error('Socket Server Host is not set');

      const namespaceSocket = io(`${socketHost}${currentNamespace.endpoint}`);

      const emitRequest = { roomTitle, namespaceId, user: currentUser };
      const ackResponse = await namespaceSocket.emitWithAck('joinRoom', emitRequest);

      if (!ackResponse.success) {
        namespaceSocket.disconnect();
        setJoinError(ackResponse.error || '加入房間失敗');
      } else {
        const { numUsers, thisRoomHistory, users, host } = ackResponse;
        setRoomDetail({
          numUsers: numUsers || 0,
          history: thisRoomHistory || [],
          users: users || [],
          host: host || null,
        });

        setJoinError(null); // 清除錯誤訊息
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
        // TODO：可以做 debounce 避免大量更新
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

  // const hostSocketId = useMemo(() => {
  //   if (!roomDetail.users.length || !roomDetail.host) return null;
  //   const hostId = roomDetail.host.id;
  //   const foundHost = roomDetail.users.find((user) => user.id === hostId);
  //   if (!foundHost) return null;
  //   return foundHost.socketId;
  // }, [roomDetail]);

  // console.log('hostSocketId', hostSocketId);

  if (!selected || !user) return null;

  return (
    // <div className="flex flex-col gap-4 p-4 flex-1 overflow-hidden">
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
      {/* 房間資訊 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Subject: {selected.namespace.name.toUpperCase()}</h1>
          <section className="flex items-center gap-2 divide-x divide-muted-foreground [&>p]:pl-2">
            <p className="text-sm text-muted-foreground">Room: {selected.room.roomTitle}</p>
            {/*  host name */}
            {roomDetail.host && <p className="text-sm text-primary">Host: {roomDetail.host.name}</p>}
            <p className="text-sm text-primary">房間人數: {roomDetail.numUsers}</p>
          </section>
        </div>

        {/* 使用者列表 */}
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

      {/* 視訊與聊天室   */}
      <main className="flex flex-col md:flex-row gap-4 transition-all flex-1 md:overflow-hidden">
        {roomDetail.host && <VideoStream hostId={roomDetail.host.id} />}
        <div className="flex-1 h-[20rem] md:h-auto flex flex-col gap-4">
          <MessageDialog messages={roomDetail.history} />
          <MessageInput onMessageSend={onMessageSend} disabled={!user} />
        </div>
      </main>

      <footer className="flex items-center justify-center border-t py-4">
        <span className="text-sm text-muted-foreground text-center w-full">Rick&apos;s live stream mvp demo &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
};
