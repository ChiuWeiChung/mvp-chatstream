import { UserIcon } from 'lucide-react';
import { ChatHistoryItem } from '../app-sidebar/types';

const MessageDialog = (props:{messages: ChatHistoryItem[]}) => {
  const renderMessages = () => {
    return props.messages.map((message: ChatHistoryItem) => {
      return (
        <div className="flex gap-4 my-2 shadow-sm" key={message.date}>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white">
            {message.avatar ? <img src={message.avatar} className=' w-full h-full object-cover rounded-full '/> : <UserIcon className="h-5 w-5" />}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <p className="text-sm font-bold">{message.userName}</p>
              <p className="text-sm text-muted-foreground">{new Date(message.date).toLocaleString()}</p>
            </div>
            <p className="text-sm">{message.newMessage}</p>
          </div>
        </div>
      );
    });
  };
  return <div className="w-full bg-secondary rounded-md p-4  overflow-y-auto flex-1 flex flex-col gap-2">{renderMessages()}</div>;
};

export default MessageDialog;
