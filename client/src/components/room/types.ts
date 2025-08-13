import { User } from "@/lib/auth";
import { Message } from "../sidebar/types";

export interface RoomDetail {
  numUsers: number | null;
  history: Message[];
  users: User[];
  host: User | null;
  isHostInRoom: boolean;
  streamCode?: string;
}