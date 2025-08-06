import io from 'socket.io-client';

// 根據環境設定 Socket 連接位址
const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
