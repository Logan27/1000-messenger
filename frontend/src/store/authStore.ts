import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiService, User, AuthResponse } from '../services/api.service';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  dndEnabled: boolean; // Do Not Disturb mode (T234)

  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    passwordConfirm: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => void;
  setDndEnabled: (enabled: boolean) => void; // T234
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        dndEnabled: false, // T234

        initialize: () => {
          const token = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');
          const state = get();

          if (token && refreshToken && state.user) {
            set({
              token,
              refreshToken,
              isAuthenticated: true,
            });
          } else if (!token || !refreshToken) {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        },

        login: async (username, password) => {
          set({ isLoading: true, error: null });
          try {
            const response: AuthResponse = await apiService.login(username, password);
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            set({
              user: response.user,
              token: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Login failed. Please try again.';
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        register: async (username, password, passwordConfirm, displayName) => {
          set({ isLoading: true, error: null });
          try {
            const response: AuthResponse = await apiService.register(
              username,
              password,
              passwordConfirm,
              displayName
            );
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            set({
              user: response.user,
              token: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Registration failed. Please try again.';
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true, error: null });
          try {
            await apiService.logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        refreshTokens: async () => {
          const state = get();
          if (!state.refreshToken) {
            throw new Error('No refresh token available');
          }

          try {
            const response: AuthResponse = await apiService.refreshToken(state.refreshToken);
            localStorage.setItem('accessToken', response.accessToken);
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            }
            set({
              token: response.accessToken,
              refreshToken: response.refreshToken || state.refreshToken,
              user: response.user,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('Token refresh error:', error);
            get().clearAuth();
            throw error;
          }
        },

        setAuth: (user, token, refreshToken) => {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            error: null,
          });
        },

        clearAuth: () => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        },

        updateUser: updates =>
          set(state => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),

        setError: error => set({ error }),

        clearError: () => set({ error: null }),

        // T234: Set DND (Do Not Disturb) mode
        setDndEnabled: enabled => {
          set({ dndEnabled: enabled });
          // Also update the notification service (T235)
          if (typeof window !== 'undefined') {
            import('../services/notification.service').then(({ notificationService }) => {
              notificationService.setEnabled(!enabled);
            });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: state => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          dndEnabled: state.dndEnabled, // T234: Persist DND preference
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);
