import { create } from 'zustand';
import axios from 'axios';

// Attach axios interceptor for automatic token header inclusion
const tokenKey = 'cinereserve_auth_token';
const initialToken = localStorage.getItem(tokenKey) || null;

if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isAdmin: false,
  isLoading: false,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'user-login', // 'user-login' | 'user-register' | 'admin-login'

  openAuthModal: (mode = 'user-login') => {
    set({ isAuthModalOpen: true, authModalMode: mode, error: null });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false, error: null });
  },

  setAuthModalMode: (mode) => {
    set({ authModalMode: mode, error: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem(tokenKey, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false,
        isAuthModalOpen: false,
        error: null
      });

      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async ({ name, email, password, phone }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, phone });
      const { token, user } = res.data;

      localStorage.setItem(tokenKey, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false,
        isAuthModalOpen: false,
        error: null
      });

      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem(tokenKey);
    delete axios.defaults.headers.common['Authorization'];
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      error: null
    });
  },

  fetchCurrentUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await axios.get('/api/auth/me');
      if (res.data?.user) {
        set({
          user: res.data.user,
          isAuthenticated: true,
          isAdmin: res.data.user.role === 'admin'
        });
      }
    } catch (err) {
      // If token expired or invalid, clear session
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  }
}));
