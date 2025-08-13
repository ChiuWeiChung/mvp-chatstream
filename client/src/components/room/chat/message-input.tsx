import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onMessageSend: (newMessage: string) => void;
  disabled?: boolean;
}

const MessageInput = (props: MessageInputProps) => {
  const [msg, setMsg] = useState('');
  const handleMsg = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (msg && !props.disabled) {
      props.onMessageSend(msg);
      setMsg('');
    }
  };

  return (
    <form className="w-full flex gap-2 mb-1" onSubmit={onSubmit}>
      <Input 
        value={msg} 
        onChange={handleMsg} 
        disabled={props.disabled}
        placeholder={props.disabled ? "請先設定您的名稱..." : "輸入訊息..."}
      />
      <Button 
        className="w-20" 
        type="submit" 
        disabled={props.disabled || !msg.trim()}
      >
        SEND
      </Button>
    </form>
  );
};

export default MessageInput;
