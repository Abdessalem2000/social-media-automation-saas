import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin';
  name: string;
  username: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  isConnected: boolean;
  followerCount?: number;
  lastSync?: string;
}

interface SocialMediaState {
  accounts: SocialAccount[];
  isLoading: boolean;
  error: string | null;
  activePlatform: string | null;
}

const initialState: SocialMediaState = {
  accounts: [],
  isLoading: false,
  error: null,
  activePlatform: null,
};

const socialMediaSlice = createSlice({
  name: 'socialMedia',
  initialState,
  reducers: {
    connectAccountStart: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    connectAccountSuccess: (state, action: PayloadAction<SocialAccount>) => {
      state.accounts.push(action.payload);
      state.isLoading = false;
      state.error = null;
    },
    connectAccountFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    disconnectAccount: (state, action: PayloadAction<string>) => {
      state.accounts = state.accounts.filter(account => account.id !== action.payload);
    },
    updateAccount: (state, action: PayloadAction<Partial<SocialAccount> & { id: string }>) => {
      const index = state.accounts.findIndex(account => account.id === action.payload.id);
      if (index !== -1) {
        state.accounts[index] = { ...state.accounts[index], ...action.payload };
      }
    },
    setActivePlatform: (state, action: PayloadAction<string>) => {
      state.activePlatform = action.payload;
    },
    syncAccountData: (state, action: PayloadAction<{ id: string; followerCount: number; lastSync: string }>) => {
      const index = state.accounts.findIndex(account => account.id === action.payload.id);
      if (index !== -1) {
        state.accounts[index].followerCount = action.payload.followerCount;
        state.accounts[index].lastSync = action.payload.lastSync;
      }
    },
  },
});

export const {
  connectAccountStart,
  connectAccountSuccess,
  connectAccountFailure,
  disconnectAccount,
  updateAccount,
  setActivePlatform,
  syncAccountData,
} = socialMediaSlice.actions;

export default socialMediaSlice.reducer;
