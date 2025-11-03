import { UserService, UpdateProfileDto } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { ContactRepository } from '../../../src/repositories/contact.repository';
import { ChatRepository } from '../../../src/repositories/chat.repository';

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/contact.repository');
jest.mock('../../../src/repositories/chat.repository');
jest.mock('../../../src/services/storage.service');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockContactRepo: jest.Mocked<ContactRepository>;
  let mockChatRepo: jest.Mocked<ChatRepository>;

  const mockUser = {
    id: 'user-id-123',
    username: 'testuser',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    mockContactRepo = new ContactRepository() as jest.Mocked<ContactRepository>;
    mockChatRepo = new ChatRepository() as jest.Mocked<ChatRepository>;

    userService = new UserService(mockUserRepo, mockContactRepo, mockChatRepo);
  });

  describe('getProfile', () => {
    it('should return sanitized user profile', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.getProfile(mockUser.id);

      // Assert
      expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        status: mockUser.status,
        lastSeen: mockUser.lastSeen,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getProfile('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    const updateData: UpdateProfileDto = {
      displayName: 'Updated Name',
      avatarUrl: 'https://example.com/new-avatar.jpg',
    };

    it('should successfully update user profile', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...updateData };
      mockUserRepo.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateProfile(mockUser.id, updateData);

      // Assert
      expect(mockUserRepo.update).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(result.displayName).toBe(updateData.displayName);
      expect(result.avatarUrl).toBe(updateData.avatarUrl);
    });

    it('should update only displayName if avatarUrl not provided', async () => {
      // Arrange
      const partialUpdate = { displayName: 'Only Name' };
      const updatedUser = { ...mockUser, displayName: partialUpdate.displayName };
      mockUserRepo.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateProfile(mockUser.id, partialUpdate);

      // Assert
      expect(mockUserRepo.update).toHaveBeenCalledWith(mockUser.id, partialUpdate);
      expect(result.displayName).toBe(partialUpdate.displayName);
    });
  });

  describe('searchUsers', () => {
    const mockUsers = [
      { ...mockUser, id: 'user-1', username: 'alice' },
      { ...mockUser, id: 'user-2', username: 'bob' },
      { ...mockUser, id: 'user-3', username: 'charlie' },
    ];

    it('should return list of users matching query', async () => {
      // Arrange
      mockUserRepo.search.mockResolvedValue(mockUsers);

      // Act
      const result = await userService.searchUsers('al', 20);

      // Assert
      expect(mockUserRepo.search).toHaveBeenCalledWith('al', 20);
      expect(result).toHaveLength(3);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('should use default limit of 20 if not provided', async () => {
      // Arrange
      mockUserRepo.search.mockResolvedValue([]);

      // Act
      await userService.searchUsers('test');

      // Assert
      expect(mockUserRepo.search).toHaveBeenCalledWith('test', 20);
    });

    it('should return empty array if no users match', async () => {
      // Arrange
      mockUserRepo.search.mockResolvedValue([]);

      // Act
      const result = await userService.searchUsers('nonexistent');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    const viewerId = 'viewer-id-456';

    it('should return user profile without viewerId check', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.getUserById(mockUser.id);

      // Assert
      expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result.id).toBe(mockUser.id);
    });

    it('should allow user to view their own profile', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.getUserById(mockUser.id, mockUser.id);

      // Assert
      expect(result.id).toBe(mockUser.id);
    });

    it('should allow viewing profile if users are contacts', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockContactRepo.areContacts.mockResolvedValue(true);

      // Act
      const result = await userService.getUserById(mockUser.id, viewerId);

      // Assert
      expect(mockContactRepo.areContacts).toHaveBeenCalledWith(mockUser.id, viewerId);
      expect(result.id).toBe(mockUser.id);
    });

    it('should allow viewing profile if users share a chat', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockContactRepo.areContacts.mockResolvedValue(false);
      mockChatRepo.findSharedChats.mockResolvedValue([{ id: 'chat-1' }] as any);

      // Act
      const result = await userService.getUserById(mockUser.id, viewerId);

      // Assert
      expect(mockChatRepo.findSharedChats).toHaveBeenCalledWith(mockUser.id, viewerId);
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw error if viewer cannot view profile', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockContactRepo.areContacts.mockResolvedValue(false);
      mockChatRepo.findSharedChats.mockResolvedValue([]);

      // Act & Assert
      await expect(userService.getUserById(mockUser.id, viewerId)).rejects.toThrow(
        'You do not have permission to view this profile'
      );
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateStatus', () => {
    it('should successfully update status to online', async () => {
      // Arrange
      mockUserRepo.updateStatus.mockResolvedValue(undefined as any);

      // Act
      await userService.updateStatus(mockUser.id, 'online');

      // Assert
      expect(mockUserRepo.updateStatus).toHaveBeenCalledWith(mockUser.id, 'online');
    });

    it('should successfully update status to offline', async () => {
      // Arrange
      mockUserRepo.updateStatus.mockResolvedValue(undefined as any);

      // Act
      await userService.updateStatus(mockUser.id, 'offline');

      // Assert
      expect(mockUserRepo.updateStatus).toHaveBeenCalledWith(mockUser.id, 'offline');
    });

    it('should successfully update status to away', async () => {
      // Arrange
      mockUserRepo.updateStatus.mockResolvedValue(undefined as any);

      // Act
      await userService.updateStatus(mockUser.id, 'away');

      // Assert
      expect(mockUserRepo.updateStatus).toHaveBeenCalledWith(mockUser.id, 'away');
    });

    it('should throw error for invalid status', async () => {
      // Act & Assert
      await expect(userService.updateStatus(mockUser.id, 'invalid')).rejects.toThrow('Invalid status value');
    });
  });

  describe('updateLastSeen', () => {
    it('should update user last seen timestamp', async () => {
      // Arrange
      mockUserRepo.updateLastSeen.mockResolvedValue(undefined as any);

      // Act
      await userService.updateLastSeen(mockUser.id);

      // Assert
      expect(mockUserRepo.updateLastSeen).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('canViewUserProfile', () => {
    const userId = 'user-id-123';
    const viewerId = 'viewer-id-456';

    it('should return true if user is viewing their own profile', async () => {
      // Act
      const result = await userService.canViewUserProfile(userId, userId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true if users are contacts', async () => {
      // Arrange
      mockContactRepo.areContacts.mockResolvedValue(true);

      // Act
      const result = await userService.canViewUserProfile(userId, viewerId);

      // Assert
      expect(mockContactRepo.areContacts).toHaveBeenCalledWith(userId, viewerId);
      expect(result).toBe(true);
    });

    it('should return true if users share a chat', async () => {
      // Arrange
      mockContactRepo.areContacts.mockResolvedValue(false);
      mockChatRepo.findSharedChats.mockResolvedValue([{ id: 'chat-1' }] as any);

      // Act
      const result = await userService.canViewUserProfile(userId, viewerId);

      // Assert
      expect(mockChatRepo.findSharedChats).toHaveBeenCalledWith(userId, viewerId);
      expect(result).toBe(true);
    });

    it('should return false if users are not connected', async () => {
      // Arrange
      mockContactRepo.areContacts.mockResolvedValue(false);
      mockChatRepo.findSharedChats.mockResolvedValue([]);

      // Act
      const result = await userService.canViewUserProfile(userId, viewerId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
