import { useCallback, useEffect, useState } from 'react';
import MessageInput from '@/components/message-input';
import MessageDialog from '@/components/message-dialog';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useParams } from 'react-router';
import { io, Socket } from 'socket.io-client';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import { useNavigate } from 'react-router';
import { ChatHistoryItem } from '../app-sidebar/types';

export const Component = () => {
  const { namespace, roomId } = useParams<{ namespace: string; roomId: string }>();
  const { namespaces, selected, setCurrent } = useNamespaceStore();
  const [nsSocket, setNsSocket] = useState<Socket>();
  const [roomDetail, setRoomDetail] = useState<{ numUsers: number | null; history: ChatHistoryItem[] }>({ numUsers: null, history: [] });
  const navigate = useNavigate();

  const joinRoom = useCallback(
    async (roomTitle: string, namespaceId: number) => {
      // const namespaceId = selectedNamespace?.id;
      const namespaceSocket = io(`http://localhost:3001/${namespace}`);
      const ackResponse: { numUsers: number; thisRoomHistory: ChatHistoryItem[] } = await namespaceSocket.emitWithAck('joinRoom', { roomTitle, namespaceId });
      const { numUsers, thisRoomHistory } = ackResponse;
      setNsSocket(namespaceSocket);
      setRoomDetail({
        numUsers,
        history: thisRoomHistory,
      });
    },
    [namespace],
  );

  const onMessageSend = (newMessage: string) => {
    if (nsSocket && selected.namespace) {
      // TODO 透過 Auth 取得登入使用者資料
      const request: ChatHistoryItem = {
        userName: 'XXX',
        date: Date.now(),
        newMessage: newMessage,
        selectedNsId: selected.namespace.id,
        avatar: 'https://vevmo.com/sites/default/files/nick-young-confused-face.png',
      };
      nsSocket.emit('newMessageToRoom', request);
    }
  };

  useEffect(() => {
    if (namespaces.length) {
      const foundNs = namespaces.find((ns) => ns.endpoint?.replace('/', '') === namespace);
      const foundRoom = foundNs?.rooms?.find((room) => String(room.roomId) === roomId);

      if (foundRoom && foundNs) {
        setCurrent({ namespace: foundNs, room: foundRoom });
        joinRoom(foundRoom.roomTitle, foundNs.id);
      } else navigate('/notfound');
    }
  }, [namespace, roomId, namespaces, navigate, setCurrent, joinRoom]);

  useEffect(() => {
    if (nsSocket) {
      nsSocket.on('messageToRoom', (newMessage: ChatHistoryItem) => {
        setRoomDetail((prev) => ({ ...prev, history: [...prev.history, newMessage] }));
      });
      nsSocket.on('numUsersUpdate',(numUsers:number)=>{
        setRoomDetail((prev) => ({ ...prev, numUsers: numUsers }));
        // console.log('numUsersUpdate',numUsers);
      });
      return () => {
        // unmount 時，斷開與 namespace 的連線
        nsSocket.disconnect();
      };
    }
  }, [nsSocket]);

  if (!selected.namespace || !selected.room) return null;
  return (
    <main className="p-4 flex flex-col gap-4 h-[100vh] transition-all flex-1">
      <SidebarTrigger />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Subject: {selected.namespace.name.toUpperCase()}</h1>
          <section className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Room: {selected.room.roomTitle}</p>
            <p className="text-sm text-primary">Users: {roomDetail.numUsers}</p>
          </section>
        </div>
      </div>
      <MessageDialog messages={roomDetail.history} />
      <MessageInput onMessageSend={onMessageSend} />
    </main>
  );
};
