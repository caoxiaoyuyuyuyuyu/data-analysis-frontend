import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const loadInitialState = (): AuthState => {
  const token = localStorage.getItem('token');
  return {
    user: null,
    token: token,
    isAuthenticated: false, // 初始设为false，等待验证
  };
};

const initialState: AuthState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      // console.log('setCredentials', action.payload);
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // console.log('setCredentials', state.user);
      // console.log('setCredentials', state.token);
      // console.log('setCredentials', state.isAuthenticated);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;