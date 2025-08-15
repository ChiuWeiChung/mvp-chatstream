import type { Namespace as SocketNamespace, Socket } from 'socket.io';
import Room from '../classes/Room';
import type { Message, User } from '../classes/Room';
import Namespace from '../classes/Namespace';
import { getCurrentPosition } from '../lib/utils';

export function registerNamespaceHandlers(nsp: SocketNamespace, namespaceData: Namespace) {
  nsp.on('connection', (nsSocket: Socket) => {

    // ====== 接收用戶加入房間的請求 ======
    nsSocket.on('joinRoom', async ({ roomTitle, namespaceId, user }, ack) => {
      try {
        const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
        if (!currentRoom) return ack({ success: false, error: 'Room not found' });

        // 先從所有房間移除該 socket（避免重複）
        namespaceData.rooms.forEach((room) => room.removeUserBySocketId(nsSocket.id));
        
        // 在 Room class 中加入使用者，並確認是否加入成功
        const userWithSocketId: User = { id: user.id, name: user.name, socketId: nsSocket.id };
        const canJoin = currentRoom.addUser(userWithSocketId);
        if (!canJoin) return ack({ success: false, error: 'Failed to join room: user already exists' });

        // 離開舊房間（第一個是自己的房間 id）
        [...nsSocket.rooms].forEach((room, idx) => {
          if (idx !== 0) nsSocket.leave(room);
        });

        // 將用戶加入新房間
        nsSocket.join(roomTitle);

        // 取得房間內使用者列表，並確認是否為 host
        const roomUsers = currentRoom.getUsers();
        const isHostInRoom = roomUsers.some((u) => u.id === currentRoom.host.id);
        nsp.in(roomTitle).emit('roomUsersUpdate', { roomUsers, isHostInRoom });

        // 回傳使用者列表、房間歷史訊息、房間 host、是否為 host、串流 code
        ack({
          success: true,
          users: roomUsers,
          numUsers: roomUsers.length,
          history: currentRoom.history,
          host: currentRoom.host,
          isHostInRoom,
          streamCode: currentRoom.code,
        });

        console.log(`User ${user.name} joined room ${roomTitle} in namespace ${currentNamespace?.name}`);
      } catch (e) {
        console.error('Error joining room:', e);
        ack({ success: false, error: 'Failed to join room' });
      }
    });

    // ====== 接收用戶發出的新訊息 ======
    nsSocket.on('newMessageToRoom', (msg: Message) => {
      const { currentRoom } = getCurrentPosition({ namespaceId: msg.namespaceId, roomTitle: msg.roomTitle });
      if (!currentRoom) return;
      nsp.in(currentRoom.roomTitle).emit('messageToRoom', msg);
      currentRoom.addMessage(msg);
    });

    // ====== 接收 host 發出的創建房間請求 ======
    nsSocket.on('createRoom', ({ roomTitle, namespaceId, host }, ack) => {
      try {
        const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
        if (!currentNamespace) return ack({ success: false, error: 'Namespace not found' });
        if (currentRoom) return ack({ success: false, error: 'Room already exists' });

        // 創建新房間
        const newRoomId = currentNamespace.rooms.length;
        const newRoom = new Room(newRoomId, roomTitle, namespaceId, host);
        // 將新房間加入到 namespace
        currentNamespace.addRoom(newRoom);

        // 廣播新房間資訊
        nsp.emit('roomCreated', {
          namespaceId,
          newRoom: {
            roomId: newRoom.roomId,
            roomTitle: newRoom.roomTitle,
            namespaceId: newRoom.namespaceId,
            history: newRoom.history,
          },
        });

        ack({ success: true, room: newRoom });
        console.log(`New room created: ${roomTitle} in namespace ${currentNamespace.name}`);
      } catch (e) {
        console.error('Error creating room:', e);
        ack({ success: false, error: 'Failed to create room' });
      }
    });

    // ====== 接收 host 發出的停止直播請求 ======
    nsSocket.on('stopStreaming', ({ namespaceId, roomTitle }, ack) => {
      const { currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
      if (!currentRoom) return ack({ success: false, error: 'Room not found' });
      currentRoom.updateStreamKey(undefined);
      nsp.in(currentRoom.roomTitle).emit('streamCodeUpdate', undefined);
      ack({ success: true });
    });

    // ====== 接收用戶離開房間時 ======
    nsSocket.on('disconnecting', () => {
      const leftRoomName = [...nsSocket.rooms][1];
      if (!leftRoomName || leftRoomName === nsSocket.id) return;

      namespaceData.rooms.forEach((room) => {
        if (room.roomTitle === leftRoomName) {
          room.removeUserBySocketId(nsSocket.id);
          // 向房間內剩餘使用者廣播使用者列表更新，並且如果 host 離開，則廣播串流 code 更新為 undefined
          const remainingUsers = room.getUsers();
          const isHostInRoom = remainingUsers.some((u) => u.id === room.host.id);
          nsp.in(leftRoomName).emit('roomUsersUpdate', { roomUsers: remainingUsers, isHostInRoom });
          if (!isHostInRoom) nsp.in(leftRoomName).emit('streamCodeUpdate', undefined);
          console.log(`User disconnected from room (${leftRoomName}), remaining users: ${remainingUsers.length}`);
        }
      });
    });
  });
}
