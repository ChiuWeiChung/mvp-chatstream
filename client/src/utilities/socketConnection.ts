import io from 'socket.io-client';

// 根據環境設定 Socket 連接位址
// 如果有設定環境變數則使用，否則使用當前頁面的協議和主機（透過 nginx 代理）
export const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

const socket = io(socketUrl);

socket.on('connect', () => {
  console.log('websocket connected to:', socketUrl);
});

socket.on('disconnect', () => {
  console.log('websocket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('websocket connection error:', error);
});

export default socket;
