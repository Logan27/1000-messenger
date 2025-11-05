import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Input, Button, Avatar } from '../components/common';
import axios from 'axios';
import { config } from '../config';

// Create API client instance
const api = axios.create({
  baseURL: config.API_URL,
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

/**
 * ProfilePage - User profile management page
 * Allows users to view and update their profile information
 */
export const ProfilePage = () => {
  const { logout, dndEnabled, setDndEnabled } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'online' | 'away' | 'offline'>('online');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/me');
      setProfile(response.data);
      setDisplayName(response.data.displayName || '');
      setSelectedStatus(response.data.status || 'online');
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Update profile info
      await api.put('/users/me', {
        displayName,
        status: selectedStatus,
      });

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.patch('/users/me/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      await loadProfile();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(profile?.displayName || '');
    setSelectedStatus(profile?.status || 'online');
    setAvatarFile(null);
    setAvatarPreview('');
    setError('');
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
          <span className="text-secondary-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-telegram p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">My Profile</h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              Logout
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error-50 border border-error-200 text-error-700 rounded-xl text-sm animate-slide-down">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-success-50 border border-success-200 text-success-700 rounded-xl text-sm animate-slide-down">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Avatar Section - Telegram style */}
            <div className="flex flex-col items-center mb-6">
              <Avatar
                avatarUrl={avatarPreview || profile?.avatarUrl}
                name={profile?.displayName || profile?.username || 'User'}
                size="xl"
                className="mb-4"
              />

              {isEditing && (
                <div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Change Avatar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB, PNG/JPG/GIF</p>
                </div>
              )}
            </div>

            {/* Username (read-only) - Telegram style */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Username
              </label>
              <div className="px-4 py-3 bg-secondary-100 border border-secondary-200 rounded-xl text-secondary-700">
                {profile?.username}
              </div>
              <p className="text-xs text-secondary-500 mt-1">Username cannot be changed</p>
            </div>

            {/* Display Name */}
            <Input
              id="displayName"
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              helperText="This is how other users will see you"
              fullWidth
              disabled={!isEditing || isLoading}
            />

            {/* Status - Telegram style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'online' | 'away' | 'offline')}
                disabled={!isEditing || isLoading}
                className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-secondary-100 disabled:cursor-not-allowed transition-all duration-200"
              >
                <option value="online">🟢 Online</option>
                <option value="away">🟡 Away</option>
                <option value="offline">⚫ Offline</option>
              </select>
            </div>

            {/* Do Not Disturb Toggle (T233) - Telegram style */}
            <div className="mb-6 p-4 bg-secondary-50 rounded-xl border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="dnd-toggle" className="block text-sm font-medium text-secondary-900">
                    Do Not Disturb
                  </label>
                  <p className="text-xs text-secondary-500 mt-1">
                    Disable browser notifications for new messages
                  </p>
                </div>
                <button
                  id="dnd-toggle"
                  type="button"
                  role="switch"
                  aria-checked={dndEnabled}
                  onClick={() => setDndEnabled(!dndEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
                    dndEnabled ? 'bg-primary-500' : 'bg-secondary-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-soft transition-transform ${
                      dndEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>

          {/* Additional Info */}
          {profile?.lastSeen && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Last seen: {new Date(profile.lastSeen).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
