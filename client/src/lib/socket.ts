import io, { Socket } from 'socket.io-client';

// 根據環境設定 Socket 連接位址
export const socketUrl = import.meta.env.VITE_API_URL 

// 創建 Socket 連接管理器
class SocketManager {
  private socket: Socket | null = null;
  

  getSocket(): Socket {
    if (!this.socket || this.socket.disconnected) {
      this.connect();
    }
    return this.socket!;
  }

  private connect() {
    
    // 如果已有連接，先斷開
    if (this.socket) this.socket.disconnect();
    
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      console.log('websocket connected to:', socketUrl, 'socket id:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('websocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('websocket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 提供重新連接方法，用於認證狀態變化時
//   reconnect() {
//     console.log('Socket reconnecting due to auth state change...');
//     this.disconnect();
//     // 給一點時間讓舊連接完全關閉
//     setTimeout(() => {
//       this.getSocket();
//     }, 100);
//     return this.getSocket();
//   }
}

const socketManager = new SocketManager();
export const getSocket = () => socketManager.getSocket();
export const socketDisconnect = () => socketManager.disconnect();
