import { Routes, Route, Navigate } from 'react-router-dom';
import { ChatWindow } from './ChatWindow';
import { ContactsPage } from '../../pages/ContactsPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { UserProfilePage } from '../../pages/UserProfilePage';
import { SearchPage } from '../../pages/SearchPage';
import { Navigation } from '../common/Navigation';

export const ChatLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-secondary-50">
      <Navigation />
      <div className="flex-1 overflow-hidden bg-white">
        <Routes>
          {/* Main chat view */}
          <Route path="/" element={<ChatWindow />} />

          {/* Direct chat by ID */}
          <Route path="/chat/:chatId" element={<ChatWindow />} />

          {/* Group chat by slug */}
          <Route path="/chat/slug/:slug" element={<ChatWindow />} />

          {/* Direct link to specific message */}
          <Route path="/chat/:chatId/message/:messageId" element={<ChatWindow />} />

          {/* Contacts page */}
          <Route path="/contacts" element={<ContactsPage />} />

          {/* Search page */}
          <Route path="/search" element={<SearchPage />} />

          {/* User profile page */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* User profile by ID (T228) */}
          <Route path="/user/:userId" element={<UserProfilePage />} />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};
