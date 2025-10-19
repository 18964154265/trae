import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../services/api';
import { authAPI, apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
  getCurrentUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login(credentials);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Set token in API client
            apiClient.setToken(token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || '登录失败',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败',
          });
          return false;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(userData);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Set token in API client
            apiClient.setToken(token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || '注册失败',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '注册失败',
          });
          return false;
        }
      },

      logout: () => {
        // Clear token from API client
        apiClient.clearToken();
        
        // Call logout API (fire and forget)
        authAPI.logout().catch(console.error);
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshToken: async () => {
        try {
          const response = await authAPI.refreshToken();
          
          if (response.success && response.data) {
            const { token } = response.data;
            
            // Set new token in API client
            apiClient.setToken(token);
            
            set({ token });
            return true;
          } else {
            // Refresh failed, logout user
            get().logout();
            return false;
          }
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          return false;
        }
      },

      getCurrentUser: async () => {
        const { token } = get();
        
        if (!token) return;
        
        try {
          const response = await authAPI.getCurrentUser();
          
          if (response.success && response.data) {
            set({ user: response.data });
          } else {
            // User fetch failed, might need to refresh token
            const refreshSuccess = await get().refreshToken();
            if (!refreshSuccess) {
              get().logout();
            }
          }
        } catch (error) {
          console.error('Failed to get current user:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in API client when rehydrating from storage
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      },
    }
  )
);