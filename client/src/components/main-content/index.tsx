import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import MessageInput from '@/components/message-input';
import MessageDialog from '@/components/message-dialog';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const MainContent = () => {
  const { isMobile, open } = useSidebar();
  const sidebarWidth = SIDEBAR_WIDTH;
  const sidebarWidthIcon = SIDEBAR_WIDTH_ICON;
  const mainWidth = !open || isMobile ? `w-[calc(100vw-${sidebarWidthIcon})]` : `w-[calc(100vw-${sidebarWidth})]`;

  useEffect(() => {
    // // 連接到後端的 Socket.IO 伺服器
    // const socket = io('http://localhost:3001'); // 替換成後端的 URL
    // // 收到後端的訊息
    // socket.on('connect', () => {
    //   console.log('Connected to server');
    //   // 測試事件接收
    //   socket.on('message', (data) => {
    //     console.log('Received message:', data);
    //   });
    //   // 測試發送事件
    //   socket.emit('hello', 'Hello from React!!');
    // });
    // // 斷開連接時的清理
    // return () => {
    //   socket.disconnect();
    // };
  }, []);

  return (
    <main className={cn('p-4 flex flex-col gap-4 h-[100vh]', mainWidth)}>
      <SidebarTrigger />
      <MessageDialog />
      <MessageInput />
    </main>
  );
};

export default MainContent;
