import { useCallback, useEffect, useState } from 'react';
import MessageInput from '@/components/message-input';
import MessageDialog from '@/components/message-dialog';
import UserNameModal from '@/components/user-name-modal';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useParams } from 'react-router';
import { io, Socket } from 'socket.io-client';
import { useNamespaceStore } from '@/hooks/use-namespace-store';
import { useUserStore, type User } from '@/hooks/use-user-store';
import { useNavigate } from 'react-router';
import { ChatHistoryItem } from '../app-sidebar/types';
import { UserIcon } from 'lucide-react';

export const Component = () => {
  const { namespace, roomId } = useParams<{ namespace: string; roomId: string }>();
  const { namespaces, selected, setCurrent } = useNamespaceStore();
  const { user, setUser, loadUserFromSession } = useUserStore();
  const [nsSocket, setNsSocket] = useState<Socket>();
  const [roomDetail, setRoomDetail] = useState<{ 
    numUsers: number | null; 
    history: ChatHistoryItem[];
    users: User[];
  }>({ numUsers: null, history: [], users: [] });
  const [showUserModal, setShowUserModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const navigate = useNavigate();

  const joinRoom = useCallback(
    async (roomTitle: string, namespaceId: number, currentUser: User) => {
      try {
        setJoinError(null);
        const namespaceSocket = io(`http://localhost:3001/${namespace}`);
        
        const ackResponse = await namespaceSocket.emitWithAck('joinRoom', { 
          roomTitle, 
          namespaceId, 
          user: currentUser 
        });

        if (!ackResponse.success) {
          setJoinError(ackResponse.error || '加入房間失敗');
          namespaceSocket.disconnect();
          return;
        }

        const { numUsers, thisRoomHistory, users } = ackResponse;
        setNsSocket(namespaceSocket);
        setRoomDetail({
          numUsers,
          history: thisRoomHistory,
          users: users || [],
        });
        // 成功加入房間後清除任何之前的錯誤訊息
        setJoinError(null);
      } catch (error) {
        console.error('Join room error:', error);
        setJoinError('連線失敗，請稍後再試');
      }
    },
    [namespace],
  );

  const onMessageSend = (newMessage: string) => {
    if (nsSocket && selected.namespace && user) {
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
    const newUser: User = {
      id: userName,
      name: userName,
    };
    setUser(newUser);
    setShowUserModal(false);
  };

  // 初始化時載入使用者資料
  useEffect(() => {
    loadUserFromSession();
  }, [loadUserFromSession]);

  // 檢查使用者身份並處理房間加入
  useEffect(() => {
    if (namespaces.length) {
      const foundNs = namespaces.find((ns) => ns.endpoint?.replace('/', '') === namespace);
      const foundRoom = foundNs?.rooms?.find((room) => String(room.roomId) === roomId);

      if (foundRoom && foundNs) {
        setCurrent({ namespace: foundNs, room: foundRoom });
        
        // 檢查是否有使用者身份
        if (!user) {
          setShowUserModal(true);
        } else {
          joinRoom(foundRoom.roomTitle, foundNs.id, user);
        }
      } else {
        navigate('/notfound');
      }
    }
  }, [namespace, roomId, namespaces, navigate, setCurrent, joinRoom, user]);

  // 當使用者身份建立後，嘗試加入房間
  useEffect(() => {
    if (user && selected.namespace && selected.room && !nsSocket) {
      joinRoom(selected.room.roomTitle, selected.namespace.id, user);
    }
  }, [user, selected, joinRoom, nsSocket]);

  useEffect(() => {
    if (nsSocket) {
      nsSocket.on('messageToRoom', (newMessage: ChatHistoryItem) => {
        setRoomDetail((prev) => ({ ...prev, history: [...prev.history, newMessage] }));
      });
      
      nsSocket.on('roomUsersUpdate', (users: User[]) => {
        setRoomDetail((prev) => ({ 
          ...prev, 
          numUsers: users.length,
          users: users 
        }));
      });

      return () => {
        // unmount 時，斷開與 namespace 的連線
        nsSocket.disconnect();
      };
    }
  }, [nsSocket]);

  if (!selected.namespace || !selected.room) return null;
  
  return (
    <>
      <UserNameModal 
        open={showUserModal} 
        onSubmit={handleUserNameSubmit} 
      />
      
      <main className="p-4 flex flex-col gap-4 h-[100vh] transition-all flex-1">
        <SidebarTrigger />
        
        {joinError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md relative">
            <button 
              onClick={() => setJoinError(null)}
              className="absolute top-2 right-2 text-destructive/70 hover:text-destructive"
            >
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
                  <div
                    key={roomUser.id}
                    className="flex items-center gap-2 bg-background px-2 py-1 rounded-md text-xs"
                  >
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
