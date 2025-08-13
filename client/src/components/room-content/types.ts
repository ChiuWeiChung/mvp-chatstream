import { User } from "@/lib/auth";
import { ChatHistoryItem } from "../app-sidebar/types";

export interface RoomDetail {
  numUsers: number | null;
  history: ChatHistoryItem[];
  users: User[];
  host: User | null;
  isHostInRoom: boolean;
  streamCode?: string;
}