import { User } from "@/lib/auth";
import { Message } from "../sidebar/types";

// TODO 待 refactor (null or instance)
export interface RoomDetail {
  users: User[];
  numUsers: number;
  history: Message[];
  host: User;
  isHostInRoom: boolean;
  streamCode?: string;
  roomTitle: string;
}

type EmitJoinRoomSuccess = {
  success: true; // Discriminator
} & Omit<RoomDetail, 'roomTitle'>;

type EmitJoinRoomFailure = {
  success: false; // Discriminator
  error: string;
};

// 最終型別
export type EmitJoinRoomResponse = EmitJoinRoomSuccess | EmitJoinRoomFailure;