import { User } from "@/lib/auth";
import { Message } from "../sidebar/types";

// TODO 應該要包含 roomTitle
export interface RoomDetail {
  numUsers: number | null;
  history: Message[];
  users: User[];
  host: User | null;
  isHostInRoom: boolean;
  streamCode?: string;
}