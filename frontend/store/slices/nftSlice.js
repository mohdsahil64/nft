'use client';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentPrice: 0,
  totalMinted: 0,
  totalSupply: 2100000,
  remaining: 2100000,
  signupBonusAmount: 100,
  priceRanges: [],
  loading: false,
};

const nftSlice = createSlice({
  name: 'nft',
  initialState,
  reducers: {
    setNFTStats(state, action) {
      return { ...state, ...action.payload, loading: false };
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setNFTStats, setLoading } = nftSlice.actions;
export default nftSlice.reducer;
