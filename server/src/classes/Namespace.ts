import Room from './Room'; // 假設 Room 類別已經被改寫為 TypeScript 並存於相同目錄

class Namespace {
  id: number;
  name: string;
  image: string;
  endpoint: string;
  rooms: Room[];

  constructor(id: number, name: string, image: string, endpoint: string) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.endpoint = endpoint;
    this.rooms = [];
  }

  addRoom(roomObj: Room): void {
    this.rooms.push(roomObj);
  }
}

export default Namespace;
