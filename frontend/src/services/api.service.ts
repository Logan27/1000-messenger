import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.accessToken);
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(username: string, password: string) {
    const response = await this.api.post('/auth/register', { username, password });
    return response.data;
  }

  async login(username: string, password: string) {
    const response = await this.api.post('/auth/login', { username, password });
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  // Chat endpoints
  async getChats() {
    const response = await this.api.get('/chats');
    return response.data;
  }

  async getChat(chatId: string) {
    const response = await this.api.get(`/chats/${chatId}`);
    return response.data;
  }

  async createDirectChat(contactId: string) {
    const response = await this.api.post('/chats/direct', { contactId });
    return response.data;
  }

  async createGroupChat(name: string, participantIds: string[]) {
    const response = await this.api.post('/chats/group', { name, participantIds });
    return response.data;
  }

  // Message endpoints
  async getMessages(chatId: string, limit = 50, cursor?: string) {
    const response = await this.api.get(`/messages/${chatId}`, {
      params: { limit, cursor }
    });
    return response.data;
  }

  async sendMessage(chatId: string, message: {
    content: string;
    contentType?: 'text' | 'image' | 'system';
    metadata?: any;
    replyToId?: string;
  }) {
    const response = await this.api.post(`/messages/${chatId}`, message);
    return response.data;
  }

  async editMessage(messageId: string, content: string) {
    const response = await this.api.put(`/messages/${messageId}`, { content });
    return response.data;
  }

  async deleteMessage(messageId: string) {
    const response = await this.api.delete(`/messages/${messageId}`);
    return response.data;
  }

  async markAsRead(messageId: string) {
    const response = await this.api.post(`/messages/${messageId}/read`);
    return response.data;
  }

  async addReaction(messageId: string, emoji: string) {
    const response = await this.api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  }

  async removeReaction(reactionId: string) {
    const response = await this.api.delete(`/reactions/${reactionId}`);
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: { displayName?: string; avatarUrl?: string }) {
    const response = await this.api.put('/users/profile', data);
    return response.data;
  }

  async searchUsers(query: string, limit = 20) {
    const response = await this.api.get('/users/search', {
      params: { q: query, limit }
    });
    return response.data;
  }

  // Contact endpoints
  async getContacts() {
    const response = await this.api.get('/contacts');
    return response.data;
  }

  async getPendingRequests() {
    const response = await this.api.get('/contacts/pending');
    return response.data;
  }

  async sendContactRequest(contactId: string) {
    const response = await this.api.post('/contacts/request', { contactId });
    return response.data;
  }

  async acceptContactRequest(requestId: string) {
    const response = await this.api.post(`/contacts/${requestId}/accept`);
    return response.data;
  }

  async rejectContactRequest(requestId: string) {
    const response = await this.api.post(`/contacts/${requestId}/reject`);
    return response.data;
  }

  async removeContact(contactId: string) {
    const response = await this.api.delete(`/contacts/${contactId}`);
    return response.data;
  }

  // File upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
