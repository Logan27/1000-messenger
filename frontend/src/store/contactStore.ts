import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { config } from '../config';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: config.API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Contact {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
  isBlocked?: boolean;
}

export interface ContactRequest {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  receiver?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ContactState {
  contacts: Contact[];
  pendingRequests: ContactRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadContacts: () => Promise<void>;
  loadPendingRequests: () => Promise<void>;
  sendRequest: (contactId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
  blockContact: (contactId: string) => Promise<void>;
  unblockContact: (contactId: string) => Promise<void>;
  updateContactStatus: (contactId: string, status: Contact['status'], lastSeen?: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useContactStore = create<ContactState>()(
  devtools(
    (set, get) => ({
      contacts: [],
      pendingRequests: [],
      isLoading: false,
      error: null,

      loadContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/contacts');
          set({
            contacts: response.data.contacts || [],
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to load contacts';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      loadPendingRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/contacts/pending');
          set({
            pendingRequests: response.data.requests || [],
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to load pending requests';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      sendRequest: async (contactId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/contacts/request', { contactId });
          
          // Add to pending requests if it's outgoing
          const request = response.data.request;
          if (request) {
            set(state => ({
              pendingRequests: [...state.pendingRequests, request],
              isLoading: false,
            }));
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to send contact request';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      acceptRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(`/contacts/${requestId}/accept`);
          
          // Remove from pending requests and reload contacts
          set(state => ({
            pendingRequests: state.pendingRequests.filter(req => req.id !== requestId),
            isLoading: false,
          }));
          
          // Reload contacts to get the newly accepted contact
          await get().loadContacts();
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to accept contact request';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      rejectRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(`/contacts/${requestId}/reject`);
          
          // Remove from pending requests
          set(state => ({
            pendingRequests: state.pendingRequests.filter(req => req.id !== requestId),
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to reject contact request';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      removeContact: async (contactId: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/contacts/${contactId}`);
          
          // Remove from contacts list
          set(state => ({
            contacts: state.contacts.filter(contact => contact.id !== contactId),
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to remove contact';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      blockContact: async (contactId: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post(`/contacts/${contactId}/block`);
          
          // Update contact's blocked status
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId ? { ...contact, isBlocked: true } : contact
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to block contact';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      unblockContact: async (contactId: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/contacts/${contactId}/block`);
          
          // Update contact's blocked status
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId ? { ...contact, isBlocked: false } : contact
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to unblock contact';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      updateContactStatus: (contactId: string, status: Contact['status'], lastSeen?: string) => {
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId
              ? { ...contact, status, ...(lastSeen && { lastSeen }) }
              : contact
          ),
        }));
      },

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ContactStore',
    }
  )
);
