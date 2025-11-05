import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactStore, ContactRequest as ContactRequestType } from '../store/contactStore';
import { ContactList } from '../components/contacts/ContactList';
import { UserSearch } from '../components/contacts/UserSearch';
import { Avatar, Button } from '../components/common';
import { GroupCreate } from '../components/groups/GroupCreate';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'contacts' | 'pending' | 'search'>('contacts');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const {
    contacts,
    pendingRequests,
    isLoading,
    error,
    loadContacts,
    loadPendingRequests,
    acceptRequest,
    rejectRequest,
    clearError,
  } = useContactStore();

  // Load data on mount
  useEffect(() => {
    loadContacts();
    loadPendingRequests();
  }, [loadContacts, loadPendingRequests]);

  const handleContactClick = (contactId: string) => {
    navigate(`/chat/${contactId}`);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));
    try {
      await acceptRequest(requestId);
    } catch (err) {
      // Error is already handled by the store
      console.error('Failed to accept request:', err);
    } finally {
      setProcessingRequests((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));
    try {
      await rejectRequest(requestId);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setProcessingRequests((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderPendingRequest = (request: ContactRequestType) => {
    const isProcessing = processingRequests.has(request.id);
    const user = request.sender || request.receiver;

    return (
      <div
        key={request.id}
        className="flex items-center justify-between p-4 bg-white border border-secondary-200 rounded-xl hover:bg-secondary-50 transition-all duration-200 shadow-soft hover:shadow-medium"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Avatar
            avatarUrl={user?.avatarUrl}
            name={user?.displayName || user?.username || 'User'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {user?.displayName || user?.username || 'Unknown User'}
            </p>
            <p className="text-xs text-secondary-500 truncate">
              @{user?.username || 'unknown'}
            </p>
            <p className="text-xs text-secondary-400 mt-1">
              {formatTimeAgo(request.createdAt)}
            </p>
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="flex space-x-2 ml-3">
            <Button
              onClick={() => handleAcceptRequest(request.id)}
              disabled={isProcessing}
              size="sm"
              variant="primary"
            >
              {isProcessing ? 'Processing...' : 'Accept'}
            </Button>
            <Button
              onClick={() => handleRejectRequest(request.id)}
              disabled={isProcessing}
              size="sm"
              variant="secondary"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-secondary-50">
      {/* Header - Telegram style */}
      <div className="bg-white border-b border-secondary-100 shadow-soft px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Contacts</h1>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-200 font-medium text-sm flex items-center space-x-2 shadow-soft hover:shadow-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Create Group</span>
        </button>
      </div>

      {/* Error Alert - Telegram style */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-error-50 border border-error-200 rounded-xl flex items-center justify-between animate-slide-down">
          <p className="text-sm text-error-700 font-medium">{error}</p>
          <button
            onClick={clearError}
            className="text-error-600 hover:text-error-800 font-medium text-sm transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs - Telegram style */}
      <div className="bg-white border-b border-secondary-100 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'contacts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Contacts
            {contacts.length > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-secondary-100 text-secondary-700 text-xs font-semibold">
                {contacts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 relative ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-primary-500 text-white text-xs font-semibold shadow-soft">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'search'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Find Users
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'contacts' && (
            <div className="bg-white rounded-xl shadow-soft border border-secondary-200 overflow-hidden">
              <ContactList
                contacts={contacts}
                onContactClick={handleContactClick}
                isLoading={isLoading}
                emptyMessage="No contacts yet. Search for users to add them as contacts!"
              />
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-soft border border-secondary-200 p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-secondary-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-secondary-500">No pending contact requests</p>
                </div>
              ) : (
                pendingRequests.map(renderPendingRequest)
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-white rounded-xl shadow-soft border border-secondary-200 p-6">
              <UserSearch />
            </div>
          )}
        </div>
      </div>

      {/* Group Create Modal */}
      {showCreateGroup && (
        <GroupCreate
          contacts={contacts.map(c => ({
            id: c.id,
            username: c.username,
            displayName: c.displayName || c.username,
            avatarUrl: c.avatarUrl,
          }))}
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(chatId) => {
            setShowCreateGroup(false);
            navigate(`/chat/${chatId}`);
          }}
        />
      )}
    </div>
  );
};
