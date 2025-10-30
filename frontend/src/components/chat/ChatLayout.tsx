import { ChatWindow } from './ChatWindow';

export const ChatLayout = () => {
  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
};
