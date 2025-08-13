import namespaces from "../data/namespaces";


export const getCurrentPosition = ({namespaceId, roomTitle}: {namespaceId: number, roomTitle: string}) => {
  const currentNamespace = namespaces[namespaceId];
  const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === roomTitle);
  return { currentNamespace, currentRoom };
};