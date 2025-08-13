import { stringToColor } from '@/lib/utils';
import { Message } from '../../sidebar/types';
import { useEffect, useRef } from 'react';

const MessageDialog = (props: { messages: Message[] }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 有新訊息時，scroll 到最下方
    if (dialogRef.current) {
      dialogRef.current.scrollTo({
        top: dialogRef.current.scrollHeight,
      });
    }
  }, [props.messages]);

  const renderMessages = () => {
    return props.messages.map((message: Message) => {
      return (
        <div className="flex items-center gap-2 my-2 shadow-sm" key={message.date}>
          <div className="h-8 aspect-square flex items-center justify-center rounded-full text-white" style={{backgroundColor: stringToColor(message.userName)}}>
            {message.image ? <img src={message.image} className=" w-full h-full object-cover rounded-full " /> : message.userName.charAt(0).toLocaleUpperCase()}
          </div>
          <div className="flex flex-col gap-2 ">
            <div className="flex flex-col gap-2">
              <p className="font-bold">{message.userName}</p>
              <p className="text-muted-foreground text-xs">{new Date(message.date).toLocaleString()}</p>
            </div>
            <p>{message.newMessage}</p>
          </div>
        </div>
      );
    });
  };
  return (
    <div ref={dialogRef} className="w-full bg-secondary rounded-md p-2 overflow-y-auto flex-1 flex flex-col gap-2">
      {renderMessages()}
    </div>
  );
};

export default MessageDialog;
