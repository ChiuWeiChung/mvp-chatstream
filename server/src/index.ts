import express, { Request, Response } from 'express';
import namespaces from './data/namespaces';
import { Server } from 'socket.io';
import { Message } from './classes/Room';

const app = express();
const PORT = 3001;

// 啟動 Express 伺服器
const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 創建 Socket.IO 伺服器，允許 CORS
const io = new Server(expressServer, {
  cors: {
    origin: 'http://localhost:3000', // 允許前端來源
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 設置 API endpoint (only for test)
app.get('/hello', (_: Request, res: Response) => {
  return res.json({ message: 'hello' });
});

// Socket.io 連線事件
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 用戶初次連線時回傳 namespace 列表
  socket.on('clientConnect', () => {
    console.log(`${socket.id} has connected`);
    socket.emit('nsList', namespaces);
  });

  // 監聽用戶斷線
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // 測試訊息事件
  socket.on('hello', (msg) => {
    console.log(`Received: ${msg}`);
  });
  socket.emit('message', 'Welcome to the server!');
});

// 針對每個 namespace 設置獨立的 WebSocket 事件處理
namespaces.forEach((namespace) => {
  const nsp = io.of(namespace.endpoint);

  nsp.on('connection', (nsSocket) => {
    console.log(`User connected to namespace: ${namespace.endpoint}`);

    nsSocket.on('joinRoom', async ({ roomTitle, namespaceId }, ackCallback) => {
      const currentNamespace = namespaces[namespaceId];
      const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === roomTitle);
      const currentRoomHistory = currentRoom?.history ?? [];

      // 移除該 socket 先前加入的所有房間（第一個房間是 socket 自己的 ID，不移除）
      [...nsSocket.rooms].forEach((room, index) => {
        if (index !== 0) nsSocket.leave(room);
      });

      // 加入新房間
      nsSocket.join(roomTitle);
      const { length } = await nsp.in(roomTitle).fetchSockets();

      // 將使用者數量更新至房間內的 users
      nsp.in(roomTitle).emit('numUsersUpdate', length);

      ackCallback({
        numUsers: length,
        thisRoomHistory: currentRoomHistory,
      });
    });

    // 接收新訊息並廣播到對應房間
    nsSocket.on('newMessageToRoom', (messageObj: Message) => {
      const currentRoomName = [...nsSocket.rooms][1]; // 取得用戶所在的房間名稱
      nsp.in(currentRoomName).emit('messageToRoom', messageObj);

      // 儲存訊息至房間的歷史記錄
      const currentNamespace = namespaces[messageObj.selectedNsId];
      const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === currentRoomName);
      currentRoom?.addMessage(messageObj);
    });

    // 監聽用戶離開房間時的處理
    nsSocket.on('disconnecting', async () => {
      const leftRoom = [...nsSocket.rooms][1];
      if (leftRoom && leftRoom !== nsSocket.id) {
        const { length } = await nsp.in(leftRoom).fetchSockets();
        nsp.in(leftRoom).emit('numUsersUpdate', length - 1);
      }
    });
  });
});
