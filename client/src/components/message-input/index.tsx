import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MessageInput = () => {
  const [msg, setMsg] = useState('');
  const handleMsg = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // todo socket.io
    console.log('msg',msg)
    setMsg('');
  };
  
  return (
    <form className="w-full flex gap-2" onSubmit={onSubmit}>
      <Input value={msg} onChange={handleMsg} />
      <Button className='w-20' type="submit">SEND</Button>
    </form>
  );
};

export default MessageInput;
