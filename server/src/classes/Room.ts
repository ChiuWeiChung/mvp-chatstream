export type Message ={
  newMessage: string;
  userName: string;
  date: number;
  avatar: string;
  selectedNsId: number;
}

class Room {
  roomId: number;
  roomTitle: string;
  namespaceId: number;
  privateRoom: boolean;
  history: Message[];

  constructor(roomId: number, roomTitle: string, namespaceId: number, privateRoom: boolean = false) {
    this.roomId = roomId;
    this.roomTitle = roomTitle;
    this.namespaceId = namespaceId;
    this.privateRoom = privateRoom;
    this.history = [];
  }

  addMessage(message: Message): void {
    // 如果需要限制歷史訊息數量，可以啟用以下代碼：
    // if (this.history.length > 1000) this.history.shift();

    this.history.push(message);
  }

  clearHistory(): void {
    this.history = [];
  }
}

export default Room;
