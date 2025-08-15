import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Namespace as SocketNamespace } from 'socket.io';
import Namespace from '../classes/Namespace';
import namespaces from '../data/namespaces';

import { registerNamespaceHandlers } from './namespace-handlers';

export function createIOServer(server: HTTPServer, opt?: ConstructorParameters<typeof Server>[1]) {
  const io = new Server(server, opt);
  // 這裡只放「全域」連線事件（非 namespace）
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('clientConnect', () => {
      console.log(`${socket.id} has connected`);
      socket.emit('nsList', namespaces);
    });

    // 監聽用戶斷線
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });

  });
  return io;
}

export function registerNamespaces(io: Server, nsList:Namespace[]) {
  nsList.forEach((ns) => {
    const nsp: SocketNamespace = io.of(ns.endpoint);
    registerNamespaceHandlers(nsp, ns); // 交給 handlers 處理 joinRoom/newMessage/...
  });
}
