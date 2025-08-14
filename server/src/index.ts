import express from 'express';
import namespaces from './data/namespaces';
import { Server } from 'socket.io';
import { Message, User } from './classes/Room';
import Room from './classes/Room';
import cors from 'cors';
import { config } from 'dotenv';
import { z } from 'zod';

// 載入環境變數
config();
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import { createStreamKey, verifyStreamKey } from './lib/crypto';
import { getCurrentPosition, querySchema, waitForPlaylistReady } from './lib/utils';

const app = express();
const PORT = 3001;

// 啟動 Express 伺服器
const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 設定 CORS middleware
app.use(
  cors({
    origin: [process.env.CLIENT_AUTH_URL || 'http://localhost:3000'],
    credentials: true,
  }),
);

// 設定 better-auth routes - 使用官方的 toNodeHandler
app.all('/api/auth/*', toNodeHandler(auth));

// 接收產生 streamKey 的請求，並回傳給 user 使用 (client to server，無關 nginx)
app.get('/api/streamKey', (req, res) => {
  const { namespaceId, roomTitle, hostId } = req.query;
  const payload = { namespaceId: Number(namespaceId), roomTitle: String(roomTitle), hostId: String(hostId) };
  const result = createStreamKey(payload);
  res.json(result);
});

// 接收 RTMP Stream 推流請求(from Nginx-RTMP Server)，並驗證 streamKey (server to server，無關 client)
app.get('/rtmp/on-publish', async (req, res) => {
  const source = req.query;
  const parsed = querySchema.safeParse(source);
  if (!parsed.success) return res.status(400).send('bad query');

  const { name: streamKey } = parsed.data;
  const result = verifyStreamKey(streamKey, { ttlSec: 30 * 60 });
  if (!result.ok) return res.status(403).send(`deny: ${result.reason}`);

  const { namespaceId, roomTitle, hostId } = result.payload;
  const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
  if (!currentNamespace || !currentRoom) return res.status(403).send('deny: namespace or room not found');
  if (currentRoom.host?.id && currentRoom.host.id !== hostId) return res.status(403).send('deny: host mismatch');
  
  res.status(204).end(); // Note: 先回覆 204 給 Nginx，讓 Nginx 允許推流

  // Note: 因為允許推流後，仍要等待 m3u8 這個檔案出現後，才能廣播 streamCodeUpdate 事件，避免 client 串流失敗
  const isReady = await waitForPlaylistReady(streamKey, 5000, 250);
  if (isReady) {
    currentRoom.updateStreamKey(streamKey);
    const nsp = io.of(currentNamespace.endpoint);
    nsp.in(currentRoom.roomTitle).emit('streamCodeUpdate', streamKey);
  }
});

// 處理推流停止請求(from Nginx-RTMP Server)，並驗證 streamKey (server to server，無關 client)
app.get('/rtmp/on-publish-done', (req, res) => {
  const source = req.query;
  const parsed = querySchema.safeParse(source);
  if (!parsed.success) return res.status(204).end(); // 不影響 Nginx
  const { name: streamKey } = parsed.data;

  const result = verifyStreamKey(streamKey, { ignoreTtl: true }); // 僅解 payload，不做 TTL 檢查
  if (!result.ok) return res.status(204).end(); // 不影響 Nginx

  const { namespaceId, roomTitle } = result.payload;
  const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
  if (currentNamespace && currentRoom) {
    const nsp = io.of(currentNamespace.endpoint);
    currentRoom.updateStreamKey(undefined);
    nsp.in(currentRoom.roomTitle).emit('streamCodeUpdate', undefined);
  }

  return res.status(204).end();
});



// 創建 Socket.IO 伺服器，允許 CORS
const io = new Server(expressServer, {
  cors: {
    origin: '*', //Note: for 測試需求，允許所有來源
    methods: ['GET', 'POST'],
    credentials: true,
  },
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
    // ====== 接收用戶加入房間的請求 ======
    nsSocket.on('joinRoom', async ({ roomTitle, namespaceId, user }, ackCallback) => {
      try {
        const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });

        if (!currentRoom) {
          ackCallback({ success: false, error: 'Room not found' });
          return;
        }

        // 檢查使用者是否已在房間內
        const userWithSocketId: User = {
          id: user.id,
          name: user.name,
          socketId: nsSocket.id,
        };

        // 先從所有房間移除該 socket 的使用者（如果存在）
        namespaces.forEach((namespace) => {
          namespace.rooms.forEach((room) => {
            room.removeUserBySocketId(nsSocket.id);
          });
        });

        // 加入使用者到目標房間
        const canJoin = currentRoom.addUser(userWithSocketId);
        if (!canJoin) {
          ackCallback({
            success: false,
            error: 'Failed to join room: user already exists',
          });
          return;
        }

        // ***** NOTE: 移除該 socket 先前加入的所有房間（第一個房間是 socket 自己的 ID，不移除）*****
        [...nsSocket.rooms].forEach((room, index) => {
          if (index !== 0) nsSocket.leave(room);
        });

        // 加入新房間
        nsSocket.join(roomTitle);

        // 向房間內所有使用者廣播使用者列表更新
        const roomUsers = currentRoom.getUsers();
        const isHostInRoom = roomUsers.some((u) => u.id === currentRoom.host.id);

        const payload = {
          success: true,
          users: roomUsers,
          numUsers: roomUsers.length,
          history: currentRoom.history,
          host: currentRoom.host,
          isHostInRoom,
          streamCode: currentRoom.code,
        };

        nsp.in(roomTitle).emit('roomUsersUpdate', { roomUsers, isHostInRoom });
        ackCallback(payload);

        console.log(`User ${user.name} joined room ${roomTitle} in namespace ${currentNamespace.name}`);
      } catch (error) {
        console.error('Error joining room:', error);
        ackCallback({ success: false, error: 'Failed to join room' });
      }
    });

    // ====== 接收新訊息並廣播到對應房間 ======
    nsSocket.on('newMessageToRoom', (messageObj: Message) => {
      const { currentRoom } = getCurrentPosition({ namespaceId: messageObj.namespaceId, roomTitle: messageObj.roomTitle });
      if (currentRoom) {
        nsp.in(currentRoom.roomTitle).emit('messageToRoom', messageObj);
        currentRoom.addMessage(messageObj);
      }
    });

    // ====== 處理新增房間的請求 ======
    nsSocket.on('createRoom', ({ roomTitle, namespaceId, host }, ackCallback) => {
      try {
        const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
        if (!currentNamespace) {
          ackCallback({ success: false, error: 'Namespace not found' });
          return;
        }

        // 檢查房間名稱是否已存在
        if (currentRoom) {
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
            history: newRoom.history,
          },
        });

        ackCallback({ success: true, room: newRoom });
        console.log(`New room created: ${roomTitle} in namespace ${currentNamespace.name}`);
      } catch (error) {
        console.error('Error creating room:', error);
        ackCallback({ success: false, error: 'Failed to create room' });
      }
    });

    // ====== 接收 host 發出的停止直播請求 ======
    nsSocket.on('stopStreaming', ({ namespaceId, roomTitle }, ackCallback) => {
      const { currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
      if (currentRoom) {
        currentRoom.updateStreamKey(undefined);
        nsp.in(currentRoom.roomTitle).emit('streamCodeUpdate', undefined);
        ackCallback({ success: true });
      } else ackCallback({ success: false, error: 'Room not found' });
    });

    // ====== 處理用戶離開房間時 ======
    nsSocket.on('disconnecting', async () => {
      const leftRoomName = [...nsSocket.rooms][1];
      if (leftRoomName && leftRoomName !== nsSocket.id) {
        // 從房間中移除使用者
        namespace.rooms.forEach((room) => {
          if (room.roomTitle === leftRoomName) {
            room.removeUserBySocketId(nsSocket.id);
            // 向房間內剩餘使用者廣播使用者列表更新
            const remainingUsers = room.getUsers();
            const isHostInRoom = remainingUsers.some((u) => u.id === room.host.id);
            nsp.in(leftRoomName).emit('roomUsersUpdate', { roomUsers: remainingUsers, isHostInRoom });
            if (!isHostInRoom) nsp.in(leftRoomName).emit('streamCodeUpdate', undefined);
            console.log(`User disconnected from room ${leftRoomName}, remaining users: ${remainingUsers.length}`);
          }
        });
      }
    });
  });
});
