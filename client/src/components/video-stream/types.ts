import { Socket } from 'socket.io-client';
import { RoomDetail } from '../room-content/types';

export interface VideoStreamProps {
  roomDetail: RoomDetail;
  userIsHost: boolean;
  nsSocket?: Socket;
  namespaceId: number;
  onStreamCodeUpdate: (code?: string) => void;
  roomTitle: string;
}
