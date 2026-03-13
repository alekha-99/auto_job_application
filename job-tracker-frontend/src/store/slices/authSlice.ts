import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface User {
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Check for existing token securely
const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      // Decode user info from JWT if needed, or store user object in localStorage too
      // For now we just assume auth is true if token exists
      return {
        user: null, 
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    }
  }
  return {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Backend returns { success, message, data: { token, user } }
      const { token, user } = response.data.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('jwtToken', token);
      }
      return user || { email: credentials.email };
    } catch (err: any) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data.message || 'Login failed');
      }
      return rejectWithValue('Network error occurred');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    // Legacy sync actions for testing/compatibility
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<User>) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwtToken');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
