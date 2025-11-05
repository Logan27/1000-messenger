import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, User } from '../services/api.service';
import { useAuthStore } from '../store/authStore';

/**
 * UserProfilePage - View another user's profile (T228)
 * Accessible via /user/:userId deep link
 */
export const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    // Redirect to own profile page if viewing self
    if (currentUser && userId === currentUser.id) {
      navigate('/profile');
      return;
    }

    loadUser();
  }, [userId, currentUser]);

  const loadUser = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError('');
      const userData = await apiService.getUser(userId);
      setUser(userData);
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      setError(err.response?.data?.error || 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userId) return;

    try {
      const chat = await apiService.createDirectChat(userId);
      navigate(`/chat/${chat.id}`);
    } catch (err: any) {
      console.error('Failed to create direct chat:', err);
      setError(err.response?.data?.error || 'Failed to create chat');
    }
  };

  const handleAddContact = async () => {
    if (!userId) return;

    try {
      await apiService.sendContactRequest(userId);
      setError('');
      // TODO: Show success toast
      console.log('Contact request sent');
    } catch (err: any) {
      console.error('Failed to send contact request:', err);
      setError(err.response?.data?.error || 'Failed to send contact request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-secondary-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary-50">
        <div className="text-center max-w-md p-6">
          <div className="text-error-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-secondary-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 bg-secondary-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-32 h-32 rounded-full mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-secondary-300 flex items-center justify-center mb-4">
                <span className="text-4xl font-medium text-secondary-700">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <h1 className="text-2xl font-bold text-secondary-900 mb-1">
              {user.displayName || user.username}
            </h1>
            <p className="text-secondary-500 mb-2">@{user.username}</p>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`w-3 h-3 rounded-full ${
                  user.status === 'online'
                    ? 'bg-green-500'
                    : user.status === 'away'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                }`}
              ></span>
              <span className="text-sm text-secondary-600 capitalize">{user.status}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSendMessage}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Send Message
            </button>
            <button
              onClick={handleAddContact}
              className="flex-1 px-4 py-2 bg-secondary-200 text-secondary-700 rounded-xl hover:bg-secondary-300 transition-colors"
            >
              Add Contact
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded text-error-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 mt-4">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-secondary-500">Username</label>
              <p className="text-secondary-900">{user.username}</p>
            </div>
            {user.displayName && (
              <div>
                <label className="text-sm font-medium text-secondary-500">Display Name</label>
                <p className="text-secondary-900">{user.displayName}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-secondary-500">Status</label>
              <p className="text-secondary-900 capitalize">{user.status}</p>
            </div>
            {user.lastSeen && user.status === 'offline' && (
              <div>
                <label className="text-sm font-medium text-secondary-500">Last Seen</label>
                <p className="text-secondary-900">
                  {new Date(user.lastSeen).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
