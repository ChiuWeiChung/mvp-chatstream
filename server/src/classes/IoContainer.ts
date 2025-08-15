import type { Server } from 'socket.io';

export class IoContainer {
  private static _io: Server | null = null;
  static set(io: Server) {
    this._io = io;
  }
  static get(): Server {
    if (!this._io) throw new Error('Socket.IO not initialized');
    return this._io;
  }
}
