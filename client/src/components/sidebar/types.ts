// 定義 history 陣列中的每一個訊息物件
export type Message = {
  newMessage: string;
  date: number; // timestamp
  image?: string;
  userName: string;
  namespaceId: number;
  roomTitle: string;
};

// 定義房間的型別
export type Room = {
  roomId: number;
  roomTitle: string;
  namespaceId: number;
  privateRoom: boolean;
  history: Message[];
};

// 定義 namespace 的型別
export type Namespace = {
  id: number;
  name: string;
  image: string;
  endpoint: string;
  rooms?: Room[];
};

// 整體的 nsData 型別
export type NsData = Namespace[];
