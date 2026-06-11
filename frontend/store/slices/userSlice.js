'use client';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  wallet: null,
  token: null,
  loading: false,
  sessionChecked: false, // true after session restore attempt completes
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.sessionChecked = true;
      state.error = null;
    },
    logout(state) {
      return { ...initialState, sessionChecked: true };
    },
    sessionCheckDone(state) {
      state.sessionChecked = true;
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
    setNFTWallet(state, action) {
      state.wallet = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, loginSuccess, logout, sessionCheckDone, updateUser, setNFTWallet, setError } =
  userSlice.actions;

export default userSlice.reducer;
