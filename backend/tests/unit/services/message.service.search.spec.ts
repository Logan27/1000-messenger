import { MessageService } from '../../../src/services/message.service';
import { MessageRepository, MessageSearchResult } from '../../../src/repositories/message.repository';
import { ChatRepository } from '../../../src/repositories/chat.repository';
import { MessageDeliveryQueue } from '../../../src/queues/message-delivery.queue';
import { SocketManager } from '../../../src/websocket/socket.manager';
import { LIMITS } from '../../../src/config/constants';

jest.mock('../../../src/repositories/message.repository');
jest.mock('../../../src/repositories/chat.repository');
jest.mock('../../../src/queues/message-delivery.queue');
jest.mock('../../../src/websocket/socket.manager');

describe('MessageService - searchMessages', () => {
  let messageService: MessageService;
  let mockMessageRepo: jest.Mocked<MessageRepository>;
  let mockChatRepo: jest.Mocked<ChatRepository>;
  let mockDeliveryQueue: jest.Mocked<MessageDeliveryQueue>;
  let mockSocketManager: jest.Mocked<SocketManager>;

  const userId = 'user-123';
  const searchQuery = 'test query';
  const chatId = 'chat-456';

  const mockSearchResults: MessageSearchResult[] = [
    {
      id: 'msg-1',
      chatId: 'chat-456',
      chatName: 'Test Chat',
      senderId: 'user-789',
      senderUsername: 'testuser',
      senderDisplayName: 'Test User',
      senderAvatarUrl: null,
      content: 'This is a test query message',
      contentType: 'text',
      metadata: {},
      isEdited: false,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 'msg-2',
      chatId: 'chat-456',
      chatName: 'Test Chat',
      senderId: 'user-789',
      senderUsername: 'testuser',
      senderDisplayName: 'Test User',
      senderAvatarUrl: null,
      content: 'Another test query result',
      contentType: 'text',
      metadata: {},
      isEdited: false,
      createdAt: new Date('2024-01-14T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockMessageRepo = {
      searchMessages: jest.fn(),
    } as any;
    
    mockChatRepo = {} as any;
    mockDeliveryQueue = {} as any;
    mockSocketManager = {} as any;

    messageService = new MessageService(
      mockMessageRepo,
      mockChatRepo,
      mockDeliveryQueue,
      mockSocketManager
    );
  });

  describe('happy path', () => {
    it('should successfully search messages with valid query', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      const result = await messageService.searchMessages(userId, searchQuery);

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        50,
        undefined,
        undefined
      );
      expect(result).toEqual({
        data: mockSearchResults,
        nextCursor: '2024-01-14T10:00:00.000Z',
        hasMore: false,
      });
    });

    it('should search with chatId filter', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      const result = await messageService.searchMessages(userId, searchQuery, chatId);

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        50,
        undefined,
        chatId
      );
      expect(result.data).toEqual(mockSearchResults);
    });

    it('should search with cursor for pagination', async () => {
      const cursor = '2024-01-10T10:00:00.000Z';
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        cursor
      );

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        50,
        cursor,
        undefined
      );
      expect(result.data).toEqual(mockSearchResults);
    });

    it('should search with custom limit', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        20
      );

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        20,
        undefined,
        undefined
      );
      expect(result.data).toEqual(mockSearchResults);
    });

    it('should return hasMore as true when results equal limit', async () => {
      const limit = 2;
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        limit
      );

      expect(result.hasMore).toBe(true);
    });

    it('should return hasMore as false when results less than limit', async () => {
      const singleResult: MessageSearchResult[] = [mockSearchResults[0]!];
      mockMessageRepo.searchMessages.mockResolvedValue(singleResult);

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        50
      );

      expect(result.hasMore).toBe(false);
    });

    it('should return null nextCursor when no results', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue([]);

      const result = await messageService.searchMessages(userId, searchQuery);

      expect(result.nextCursor).toBeNull();
      expect(result.hasMore).toBe(false);
    });
  });

  describe('query validation', () => {
    it('should throw error for empty query string', async () => {
      await expect(
        messageService.searchMessages(userId, '')
      ).rejects.toThrow('Search query cannot be empty');

      expect(mockMessageRepo.searchMessages).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only query', async () => {
      await expect(
        messageService.searchMessages(userId, '   ')
      ).rejects.toThrow('Search query cannot be empty');

      expect(mockMessageRepo.searchMessages).not.toHaveBeenCalled();
    });

    it('should trim whitespace from query', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      await messageService.searchMessages(userId, '  test query  ');

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        'test query',
        50,
        undefined,
        undefined
      );
    });
  });

  describe('limit enforcement', () => {
    it('should clamp limit to MAX_SEARCH_RESULTS', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        LIMITS.MAX_SEARCH_RESULTS + 50
      );

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        LIMITS.MAX_SEARCH_RESULTS,
        undefined,
        undefined
      );
    });

    it('should allow limit equal to MAX_SEARCH_RESULTS', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        LIMITS.MAX_SEARCH_RESULTS
      );

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        LIMITS.MAX_SEARCH_RESULTS,
        undefined,
        undefined
      );
    });

    it('should allow limit less than MAX_SEARCH_RESULTS', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        10
      );

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        10,
        undefined,
        undefined
      );
    });

    it('should use default limit of 50 when not provided', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      await messageService.searchMessages(userId, searchQuery);

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        50,
        undefined,
        undefined
      );
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockMessageRepo.searchMessages.mockRejectedValue(repositoryError);

      await expect(
        messageService.searchMessages(userId, searchQuery)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle repository returning unexpected data', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue(null as any);

      await expect(
        messageService.searchMessages(userId, searchQuery)
      ).rejects.toThrow();
    });
  });

  describe('complex scenarios', () => {
    it('should handle search with all parameters', async () => {
      const cursor = '2024-01-10T10:00:00.000Z';
      const limit = 25;
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        chatId,
        cursor,
        limit
      );

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        limit,
        cursor,
        chatId
      );
      expect(result.data).toEqual(mockSearchResults);
      expect(result.nextCursor).toBe('2024-01-14T10:00:00.000Z');
    });

    it('should handle single result correctly', async () => {
      const singleResult: MessageSearchResult[] = [mockSearchResults[0]!];
      mockMessageRepo.searchMessages.mockResolvedValue(singleResult);

      const result = await messageService.searchMessages(
        userId,
        searchQuery,
        undefined,
        undefined,
        1
      );

      expect(result.data).toEqual(singleResult);
      expect(result.nextCursor).toBe('2024-01-15T10:00:00.000Z');
      expect(result.hasMore).toBe(true);
    });

    it('should handle special characters in search query', async () => {
      const specialQuery = "test's \"special\" characters";
      mockMessageRepo.searchMessages.mockResolvedValue(mockSearchResults);

      await messageService.searchMessages(userId, specialQuery);

      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith(
        userId,
        specialQuery,
        50,
        undefined,
        undefined
      );
    });
  });
});
