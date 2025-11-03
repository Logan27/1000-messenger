import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  slug?: string;
  avatarUrl?: string;
  ownerId?: string;
  lastMessageAt?: string;
  participants: ChatParticipant[];
  unreadCount?: number;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId?: string;
  sender?: User;
  content: string;
  contentType: 'text' | 'image' | 'system';
  metadata?: Record<string, unknown>;
  replyToId?: string;
  replyTo?: Message;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  deliveryStatus?: 'sent' | 'delivered' | 'read';
}

export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  user?: User;
  emoji: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  status: 'pending' | 'accepted' | 'blocked';
  requestedBy: string;
  contact?: User;
  createdAt: string;
  acceptedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<AuthResponse> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: config.API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        console.error('[API] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      response => response,
      async (error: AxiosError<{ error?: ApiError }>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (!originalRequest) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              this.handleAuthError();
              return Promise.reject(error);
            }

            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.performTokenRefresh(refreshToken);
            }

            const response = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            localStorage.setItem('accessToken', response.accessToken);
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            this.refreshTokenPromise = null;
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        if (error.response?.data?.error) {
          console.error('[API] Error:', error.response.data.error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private async performTokenRefresh(refreshToken: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${config.API_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  }

  private handleAuthError() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  async register(
    username: string,
    password: string,
    passwordConfirm: string,
    displayName?: string
  ): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', {
      username,
      password,
      passwordConfirm,
      displayName,
    });
    return response.data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/users/me');
    return response.data;
  }

  async updateProfile(data: {
    displayName?: string;
    status?: 'online' | 'offline' | 'away';
  }): Promise<User> {
    const response = await this.api.put<User>('/users/me', data);
    return response.data;
  }

  async updateAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await this.api.patch<User>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.api.get<User>(`/users/${userId}`);
    return response.data;
  }

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    const response = await this.api.get<User[]>('/users/search', {
      params: { q: query, limit },
    });
    return response.data;
  }

  async getContacts(): Promise<Contact[]> {
    const response = await this.api.get<Contact[]>('/contacts');
    return response.data;
  }

  async getPendingRequests(): Promise<Contact[]> {
    const response = await this.api.get<Contact[]>('/contacts/pending');
    return response.data;
  }

  async sendContactRequest(userId: string): Promise<Contact> {
    const response = await this.api.post<Contact>('/contacts', { userId });
    return response.data;
  }

  async acceptContactRequest(contactId: string): Promise<Contact> {
    const response = await this.api.put<Contact>(`/contacts/${contactId}/accept`);
    return response.data;
  }

  async rejectContactRequest(contactId: string): Promise<void> {
    await this.api.put(`/contacts/${contactId}/reject`);
  }

  async removeContact(contactId: string): Promise<void> {
    await this.api.delete(`/contacts/${contactId}`);
  }

  async getChats(): Promise<Chat[]> {
    const response = await this.api.get<Chat[]>('/chats');
    return response.data;
  }

  async getChat(chatId: string): Promise<Chat> {
    const response = await this.api.get<Chat>(`/chats/${chatId}`);
    return response.data;
  }

  async getChatBySlug(slug: string): Promise<Chat> {
    const response = await this.api.get<Chat>(`/chats/slug/${slug}`);
    return response.data;
  }

  async createDirectChat(contactId: string): Promise<Chat> {
    const response = await this.api.post<Chat>('/chats/direct', { contactId });
    return response.data;
  }

  async createGroupChat(name: string, participantIds: string[]): Promise<Chat> {
    const response = await this.api.post<Chat>('/chats/group', {
      name,
      participantIds,
    });
    return response.data;
  }

  async updateGroupChat(
    chatId: string,
    data: { name?: string; avatarUrl?: string }
  ): Promise<Chat> {
    const response = await this.api.put<Chat>(`/chats/${chatId}`, data);
    return response.data;
  }

  async deleteGroupChat(chatId: string): Promise<void> {
    await this.api.delete(`/chats/${chatId}`);
  }

  async addParticipant(chatId: string, userId: string): Promise<Chat> {
    const response = await this.api.post<Chat>(`/chats/${chatId}/participants`, {
      userId,
    });
    return response.data;
  }

  async removeParticipant(chatId: string, userId: string): Promise<Chat> {
    const response = await this.api.delete<Chat>(
      `/chats/${chatId}/participants/${userId}`
    );
    return response.data;
  }

  async leaveChat(chatId: string): Promise<void> {
    await this.api.post(`/chats/${chatId}/leave`);
  }

  async getMessages(
    chatId: string,
    limit = 50,
    cursor?: string
  ): Promise<PaginatedResponse<Message>> {
    const response = await this.api.get<PaginatedResponse<Message>>(
      `/chats/${chatId}/messages`,
      {
        params: { limit, cursor },
      }
    );
    return response.data;
  }

  async sendMessage(
    chatId: string,
    data: {
      content: string;
      contentType?: 'text' | 'image' | 'system';
      metadata?: Record<string, unknown>;
      replyToId?: string;
    }
  ): Promise<Message> {
    const response = await this.api.post<Message>(`/chats/${chatId}/messages`, data);
    return response.data;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await this.api.put<Message>(`/messages/${messageId}`, {
      content,
    });
    return response.data;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.api.delete(`/messages/${messageId}`);
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.api.post(`/messages/${messageId}/read`);
  }

  async markChatAsRead(chatId: string): Promise<void> {
    await this.api.post(`/chats/${chatId}/read`);
  }

  async addReaction(messageId: string, emoji: string): Promise<Reaction> {
    const response = await this.api.post<Reaction>(`/messages/${messageId}/reactions`, {
      emoji,
    });
    return response.data;
  }

  async removeReaction(messageId: string, reactionId: string): Promise<void> {
    await this.api.delete(`/messages/${messageId}/reactions/${reactionId}`);
  }

  async uploadImage(file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.api.post<Attachment>('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAttachment(attachmentId: string): Promise<Attachment> {
    const response = await this.api.get<Attachment>(`/attachments/${attachmentId}`);
    return response.data;
  }

  async searchMessages(
    query: string,
    chatId?: string,
    limit = 100
  ): Promise<PaginatedResponse<Message>> {
    const response = await this.api.get<PaginatedResponse<Message>>('/messages/search', {
      params: { q: query, chatId, limit },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
