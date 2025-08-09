import express, { Request, Response } from 'express';
import namespaces from './data/namespaces';
import { Server } from 'socket.io';
import { Message, User } from './classes/Room';
import Room from './classes/Room';

const app = express();
const PORT = 3001;

// 啟動 Express 伺服器
const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 創建 Socket.IO 伺服器，允許 CORS
const io = new Server(expressServer, {
  cors: {
    // origin: ['http://localhost:3000', 'http://localhost:8080'], // 暫時允許所有來源
    origin: '*', // for 測試需求，允許所有來源
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

    // ====== 接收用戶加入房間的請求 ======
    nsSocket.on('joinRoom', async ({ roomTitle, namespaceId, user }, ackCallback) => {
      console.log(`🔍 joinRoom request: user="${user.name}", socketId="${nsSocket.id}", room="${roomTitle}"`);
      try {
        const currentNamespace = namespaces[namespaceId];
        const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === roomTitle);
        
        if (!currentRoom) {
          ackCallback({ 
            success: false, 
            error: 'Room not found' 
          });
          return;
        }

        // 檢查使用者是否已在房間內
        const userWithSocketId: User = {
          id: user.id,
          name: user.name,
          socketId: nsSocket.id
        };

        // 先從所有房間移除該 socket 的使用者（如果存在）
        namespaces.forEach(namespace => {
          namespace.rooms.forEach(room => {
            room.removeUserBySocketId(nsSocket.id);
          });
        });

        // 加入使用者到目標房間
        const canJoin = currentRoom.addUser(userWithSocketId);
        if (!canJoin) {
          ackCallback({ 
            success: false, 
            error: 'Failed to join room: user already exists' 
          });
          return;
        }

        // NOTE: 移除該 socket 先前加入的所有房間（第一個房間是 socket 自己的 ID，不移除）
        [...nsSocket.rooms].forEach((room, index) => {
          if (index !== 0) nsSocket.leave(room);
        });

        // 加入新房間
        nsSocket.join(roomTitle);

        // 向房間內所有使用者廣播使用者列表更新
        const roomUsers = currentRoom.getUsers();
        nsp.in(roomTitle).emit('roomUsersUpdate', roomUsers);

        ackCallback({
          success: true,
          numUsers: roomUsers.length,
          thisRoomHistory: currentRoom.history,
          users: roomUsers,
          host: currentRoom.host,
        });

        console.log(`User ${user.name} joined room ${roomTitle} in namespace ${currentNamespace.name}`);
      } catch (error) {
        console.error('Error joining room:', error);
        ackCallback({ 
          success: false, 
          error: 'Failed to join room' 
        });
      }
    });

    // ====== 接收新訊息並廣播到對應房間 ======
    nsSocket.on('newMessageToRoom', (messageObj: Message) => {
      const currentRoomName = [...nsSocket.rooms][1]; // 取得用戶所在的房間名稱
      nsp.in(currentRoomName).emit('messageToRoom', messageObj);

      // 儲存訊息至房間的歷史記錄
      const currentNamespace = namespaces[messageObj.selectedNsId];
      const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === currentRoomName);
      currentRoom?.addMessage(messageObj);
    });

    // ====== 處理新增房間的請求 ======
    nsSocket.on('createRoom', ({ roomTitle, namespaceId, host }, ackCallback) => {
      try {
        const currentNamespace = namespaces[namespaceId];
        if (!currentNamespace) {
          ackCallback({ success: false, error: 'Namespace not found' });
          return;
        }

        // 檢查房間名稱是否已存在
        const existingRoom = currentNamespace.rooms.find(room => room.roomTitle === roomTitle);
        if (existingRoom) {
          ackCallback({ success: false, error: 'Room already exists' });
          return;
        }

        // 創建新房間 (roomId 為當前房間數量)
        const newRoomId = currentNamespace.rooms.length;
        const newRoom = new Room(newRoomId, roomTitle, namespaceId, host);
        
        // 將新房間加入到 namespace
        currentNamespace.addRoom(newRoom);

        // 向所有連接到此 namespace 的用戶廣播新房間資訊
        nsp.emit('roomCreated', {
          namespaceId,
          newRoom: {
            roomId: newRoom.roomId,
            roomTitle: newRoom.roomTitle,
            namespaceId: newRoom.namespaceId,
            history: newRoom.history
          }
        });

        ackCallback({ success: true, room: newRoom });
        console.log(`New room created: ${roomTitle} in namespace ${currentNamespace.name}`);
      } catch (error) {
        console.error('Error creating room:', error);
        ackCallback({ success: false, error: 'Failed to create room' });
      }
    });

    // 監聽用戶離開房間時的處理
    nsSocket.on('disconnecting', async () => {
      const leftRoomName = [...nsSocket.rooms][1];
      if (leftRoomName && leftRoomName !== nsSocket.id) {
        // 從房間中移除使用者
        namespace.rooms.forEach(room => {
          if (room.roomTitle === leftRoomName) {
            room.removeUserBySocketId(nsSocket.id);
            // 向房間內剩餘使用者廣播使用者列表更新
            const remainingUsers = room.getUsers();
            nsp.in(leftRoomName).emit('roomUsersUpdate', remainingUsers);
            console.log(`User disconnected from room ${leftRoomName}, remaining users: ${remainingUsers.length}`);
          }
        });
      }
    });
  });
});
