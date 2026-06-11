'use client';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  address: null,
  usdtBalanceBSC: '0',
  usdtBalancePolygon: '0',
  chainId: null,
  isConnecting: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setConnecting(state, action) {
      state.isConnecting = action.payload;
    },
    connectWallet(state, action) {
      state.isConnected = true;
      state.isConnecting = false;
      state.address = action.payload.address;
      state.chainId = action.payload.chainId || null;
      state.error = null;
    },
    disconnectWallet(state) {
      return initialState;
    },
    setBalances(state, action) {
      state.usdtBalanceBSC = action.payload.bsc || '0';
      state.usdtBalancePolygon = action.payload.polygon || '0';
    },
    setError(state, action) {
      state.error = action.payload;
      state.isConnecting = false;
    },
  },
});

export const { setConnecting, connectWallet, disconnectWallet, setBalances, setError } =
  walletSlice.actions;

export default walletSlice.reducer;
