export type User = {
  id: string;   // 等於使用者名稱 (唯一)
  name: string; // 與 id 相同
  socketId: string; // Socket ID 用於管理連線
};

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
  host: User;
  history: Message[];
  users: User[]; // 紀錄目前房間內的使用者

  constructor(roomId: number, roomTitle: string, namespaceId: number, host: User) {
    this.roomId = roomId;
    this.roomTitle = roomTitle;
    this.namespaceId = namespaceId;
    this.history = [];
    this.users = []; // 初始化使用者列表
    this.host = host;
  }

  addMessage(message: Message): void {
    // 如果需要限制歷史訊息數量
    // if (this.history.length > 1000) this.history.shift();

    this.history.push(message);
  }

  clearHistory(): void {
    this.history = [];
  }

  // 加入使用者到房間
  addUser(user: User): boolean {
    // 檢查是否已存在相同 id 的使用者
    const existingUser = this.users.find((u) => u.id === user.id);
    if (existingUser) {
      return false; // 使用者已存在，不能加入
    }
    this.users.push(user);
    return true; // 成功加入
  }

  // 移除使用者從房間
  removeUser(userId: string): boolean {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return false; // 使用者不存在
    }
    this.users.splice(userIndex, 1);
    return true; // 成功移除
  }

  // 根據 socketId 移除使用者
  removeUserBySocketId(socketId: string): boolean {
    const userIndex = this.users.findIndex((u) => u.socketId === socketId);
    if (userIndex === -1) {
      return false; // 使用者不存在
    }
    this.users.splice(userIndex, 1);
    return true; // 成功移除
  }

  // 取得房間內使用者列表
  getUsers(): User[] {
    return [...this.users]; // 回傳副本避免外部修改
  }
}

export default Room;
