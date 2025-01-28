import express, { Request, Response } from 'express';
import namespaces from './data/namespaces';
import { Server } from 'socket.io';
import { Message } from './classes/Room';

const app = express();

// 啟用 CORS 中間件以允許 API 路由
// app.use((_, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*'); // 或指定前端網址
//   res.header('Access-Control-Allow-Methods', 'GET, POST');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });

app.get('/hello', (_: Request, res: Response) => {
  return res.json({ message: 'hello' }); // 包裝成物件格式
});

const expressServer = app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
// 使用 Server 創建 Socket.IO 實例
const io = new Server(expressServer, {
  cors: {
    origin: 'http://localhost:3000', // 允許前端來源
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 連線相關
io.on('connection', (socket) => {
  console.log(`A user ${socket.id} has connected`);

  socket.on('clientConnect', (data) => {
    console.log(socket.id, 'has connected');
    socket.emit('nsList', namespaces);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  // ============= 測試 =============
  // 接收前端訊息
  socket.on('hello', (msg) => {
    console.log('Received:', msg);
  });

  // 傳送訊息到前端
  socket.emit('message', 'Welcome to the server!');
});

namespaces.forEach((namespace) => {
  // namespace 初始連線
  io.of(namespace.endpoint).on('connection', (nsSocket) => {
    // 加入房間
    nsSocket.on('joinRoom', async (roomObj: { roomTitle: string; namespaceId: number }, ackCallback) => {
      const { roomTitle, namespaceId } = roomObj;

      //TODO namespaces 目前是用陣列，待優化
      const currentNamespace = namespaces[namespaceId];
      //TODO room 應該用期 roomId 去尋找比較合適，待優化
      const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === roomTitle);
      //OPTIMIZATION: history 後續透過資料庫存取(namespaces & room & history 不同 table)
      const currentRoomHistory = currentRoom?.history ?? [];

      let i = 0;
      nsSocket.rooms.forEach((socketRoom) => {
        // 陣列中的第一個 room 是屬於 socket 本身，不需要被剔除
        if (i !== 0) nsSocket.leave(socketRoom);
        i++;
      });

      // 加入房間
      nsSocket.join(roomTitle);

      const { length } = await io.of(namespace.endpoint).in(roomObj.roomTitle).fetchSockets();

      // broadcast users num to room users
      io.of(namespace.endpoint).in(roomTitle).emit('numUsersUpdate', length);

      ackCallback({
        numUsers: length,
        thisRoomHistory: currentRoomHistory,
      });
    });

    // 新訊息進入房間
    nsSocket.on('newMessageToRoom', (messageObj: Message) => {
      const currentRoomName = [...nsSocket.rooms][1];
      // 將訊息播送至目前房間
      io.of(namespace.endpoint).in(currentRoomName).emit('messageToRoom', messageObj);
      // 將訊息儲存起來
      const currentNamespace = namespaces[messageObj.selectedNsId];
      const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === currentRoomName);
      // Optimization: 儲存進資料庫
      currentRoom?.addMessage(messageObj);
    });

    nsSocket.on('disconnecting', async() => {
      const leftRoom = [...nsSocket.rooms][1]
      if(leftRoom!== nsSocket.id){
        const { length } = await io.of(namespace.endpoint).in(leftRoom).fetchSockets();
        io.of(namespace.endpoint).in(leftRoom).emit('numUsersUpdate', length-1);
      }
    });
  });
});
