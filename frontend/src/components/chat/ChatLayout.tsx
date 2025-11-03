import { Routes, Route, Navigate } from 'react-router-dom';
import { ChatWindow } from './ChatWindow';

export const ChatLayout = () => {
  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <Routes>
          {/* Main chat view */}
          <Route path="/" element={<ChatWindow />} />
          
          {/* Direct chat by ID */}
          <Route path="/chat/:chatId" element={<ChatWindow />} />
          
          {/* Group chat by slug */}
          <Route path="/chat/slug/:slug" element={<ChatWindow />} />
          
          {/* Direct link to specific message */}
          <Route path="/chat/:chatId/message/:messageId" element={<ChatWindow />} />
          
          {/* Contacts page - placeholder for future implementation */}
          <Route 
            path="/contacts" 
            element={
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Contacts page - Coming soon</p>
              </div>
            } 
          />
          
          {/* User profile page - placeholder for future implementation */}
          <Route 
            path="/profile" 
            element={
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Profile page - Coming soon</p>
              </div>
            } 
          />
          
          {/* User profile by ID - placeholder for future implementation */}
          <Route 
            path="/user/:userId" 
            element={
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">User profile - Coming soon</p>
              </div>
            } 
          />
          
          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};
