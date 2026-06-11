'use client';
import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import userReducer from './slices/userSlice';
import nftReducer from './slices/nftSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    user: userReducer,
    nft: nftReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
