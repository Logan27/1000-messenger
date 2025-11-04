import { MessageRepository } from '../../../src/repositories/message.repository';
import { readPool } from '../../../src/config/database';

jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
  readPool: {
    query: jest.fn(),
  },
}));

describe('MessageRepository - searchMessages DTO', () => {
  let repository: MessageRepository;
  const mockReadPoolQuery = readPool.query as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MessageRepository();
  });

  describe('return type validation', () => {
    it('should return MessageSearchResult with all required fields', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Test Chat',
          sender_id: 'user-1',
          sender_username: 'testuser',
          sender_display_name: 'Test User',
          sender_avatar_url: 'https://example.com/avatar.jpg',
          content: 'Test message content',
          content_type: 'text',
          metadata: { key: 'value' },
          is_edited: false,
          edited_at: null,
          created_at: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);

      expect(results).toHaveLength(1);
      const result = results[0]!;
      
      expect(result).toHaveProperty('id', 'msg-1');
      expect(result).toHaveProperty('chatId', 'chat-1');
      expect(result).toHaveProperty('chatName', 'Test Chat');
      expect(result).toHaveProperty('senderId', 'user-1');
      expect(result).toHaveProperty('senderUsername', 'testuser');
      expect(result).toHaveProperty('senderDisplayName', 'Test User');
      expect(result).toHaveProperty('senderAvatarUrl', 'https://example.com/avatar.jpg');
      expect(result).toHaveProperty('content', 'Test message content');
      expect(result).toHaveProperty('contentType', 'text');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('isEdited', false);
      expect(result).toHaveProperty('createdAt');

      expect(result).not.toHaveProperty('is_deleted');
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('should handle null sender fields for system messages', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Test Chat',
          sender_id: null,
          sender_username: null,
          sender_display_name: null,
          sender_avatar_url: null,
          content: 'System message',
          content_type: 'system',
          metadata: {},
          is_edited: false,
          edited_at: null,
          created_at: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);

      expect(results).toHaveLength(1);
      const result = results[0]!;
      
      expect(result.senderId).toBeNull();
      expect(result.senderUsername).toBeNull();
      expect(result.senderDisplayName).toBeNull();
      expect(result.senderAvatarUrl).toBeNull();
    });

    it('should handle edited messages with editedAt timestamp', async () => {
      const editedAt = new Date('2024-01-15T11:00:00Z');
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Test Chat',
          sender_id: 'user-1',
          sender_username: 'testuser',
          sender_display_name: 'Test User',
          sender_avatar_url: null,
          content: 'Edited message',
          content_type: 'text',
          metadata: {},
          is_edited: true,
          edited_at: editedAt,
          created_at: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);

      expect(results).toHaveLength(1);
      expect(results[0]!.isEdited).toBe(true);
      expect(results[0]!.editedAt).toEqual(editedAt);
    });

    it('should return multiple results in correct format', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Chat One',
          sender_id: 'user-1',
          sender_username: 'user1',
          sender_display_name: 'User One',
          sender_avatar_url: null,
          content: 'First message',
          content_type: 'text',
          metadata: {},
          is_edited: false,
          edited_at: null,
          created_at: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'msg-2',
          chat_id: 'chat-2',
          chat_name: 'Chat Two',
          sender_id: 'user-2',
          sender_username: 'user2',
          sender_display_name: 'User Two',
          sender_avatar_url: 'https://example.com/avatar2.jpg',
          content: 'Second message',
          content_type: 'text',
          metadata: { type: 'reply' },
          is_edited: true,
          edited_at: new Date('2024-01-15T11:00:00Z'),
          created_at: new Date('2024-01-15T09:00:00Z'),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);

      expect(results).toHaveLength(2);
      
      expect(results[0]!.id).toBe('msg-1');
      expect(results[0]!.chatName).toBe('Chat One');
      expect(results[0]!.senderUsername).toBe('user1');
      
      expect(results[1]!.id).toBe('msg-2');
      expect(results[1]!.chatName).toBe('Chat Two');
      expect(results[1]!.senderUsername).toBe('user2');
      expect(results[1]!.isEdited).toBe(true);
    });
  });

  describe('query parameters', () => {
    beforeEach(() => {
      mockReadPoolQuery.mockResolvedValue({ rows: [] } as any);
    });

    it('should pass basic parameters correctly', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE cp.user_id = $1'),
        ['user-123', 'search term', 50]
      );
    });

    it('should include cursor parameter when provided', async () => {
      const cursor = '2024-01-15T10:00:00.000Z';
      await repository.searchMessages('user-123', 'search term', 50, cursor);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND m.created_at < $4'),
        ['user-123', 'search term', 50, cursor]
      );
    });

    it('should include chatId parameter when provided', async () => {
      await repository.searchMessages('user-123', 'search term', 50, undefined, 'chat-456');

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND m.chat_id = $4'),
        ['user-123', 'search term', 50, 'chat-456']
      );
    });

    it('should include both cursor and chatId when provided', async () => {
      const cursor = '2024-01-15T10:00:00.000Z';
      await repository.searchMessages('user-123', 'search term', 50, cursor, 'chat-456');

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND m.created_at < $4'),
        ['user-123', 'search term', 50, cursor, 'chat-456']
      );
      
      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND m.chat_id = $5'),
        expect.any(Array)
      );
    });

    it('should use read pool for query', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalled();
    });

    it('should include full-text search with PostgreSQL', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("to_tsvector('english', m.content)"),
        expect.any(Array)
      );
      
      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("plainto_tsquery('english', $2)"),
        expect.any(Array)
      );
    });

    it('should order by created_at DESC', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY m.created_at DESC'),
        expect.any(Array)
      );
    });

    it('should only return messages from chats where user is active participant', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN chat_participants cp ON c.id = cp.chat_id'),
        expect.any(Array)
      );
      
      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND cp.left_at IS NULL'),
        expect.any(Array)
      );
    });

    it('should exclude deleted messages', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND m.is_deleted = FALSE'),
        expect.any(Array)
      );
    });

    it('should use LEFT JOIN for users to handle system messages', async () => {
      await repository.searchMessages('user-123', 'search term', 50);

      expect(mockReadPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN users u ON m.sender_id = u.id'),
        expect.any(Array)
      );
    });
  });

  describe('content types', () => {
    it('should handle text messages', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Test Chat',
          sender_id: 'user-1',
          sender_username: 'testuser',
          sender_display_name: 'Test User',
          sender_avatar_url: null,
          content: 'Text message',
          content_type: 'text',
          metadata: {},
          is_edited: false,
          edited_at: null,
          created_at: new Date(),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);
      expect(results[0]!.contentType).toBe('text');
    });

    it('should handle image messages', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Test Chat',
          sender_id: 'user-1',
          sender_username: 'testuser',
          sender_display_name: 'Test User',
          sender_avatar_url: null,
          content: 'Image caption',
          content_type: 'image',
          metadata: { imageUrl: 'https://example.com/image.jpg' },
          is_edited: false,
          edited_at: null,
          created_at: new Date(),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);
      expect(results[0]!.contentType).toBe('image');
      expect(results[0]!.metadata).toHaveProperty('imageUrl');
    });

    it('should handle system messages', async () => {
      const mockRows = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          chat_name: 'Test Chat',
          sender_id: null,
          sender_username: null,
          sender_display_name: null,
          sender_avatar_url: null,
          content: 'User joined the chat',
          content_type: 'system',
          metadata: { action: 'user_joined' },
          is_edited: false,
          edited_at: null,
          created_at: new Date(),
        },
      ];

      mockReadPoolQuery.mockResolvedValue({ rows: mockRows } as any);

      const results = await repository.searchMessages('user-1', 'test', 10);
      expect(results[0]!.contentType).toBe('system');
      expect(results[0]!.senderId).toBeNull();
    });
  });
});
