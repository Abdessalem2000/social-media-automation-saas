import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlatformAnalytics {
  platform: string;
  followers: number;
  following: number;
  posts: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  reach: number;
  impressions: number;
  growth: {
    followers: number;
    engagement: number;
  };
}

interface AnalyticsState {
  data: PlatformAnalytics[];
  isLoading: boolean;
  error: string | null;
  dateRange: {
    start: string;
    end: string;
  };
  selectedPlatforms: string[];
}

const initialState: AnalyticsState = {
  data: [],
  isLoading: false,
  error: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  selectedPlatforms: [],
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    fetchAnalyticsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchAnalyticsSuccess: (state, action: PayloadAction<PlatformAnalytics[]>) => {
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchAnalyticsFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload;
    },
    setSelectedPlatforms: (state, action: PayloadAction<string[]>) => {
      state.selectedPlatforms = action.payload;
    },
    updatePlatformAnalytics: (state, action: PayloadAction<PlatformAnalytics>) => {
      const index = state.data.findIndex(item => item.platform === action.payload.platform);
      if (index !== -1) {
        state.data[index] = action.payload;
      } else {
        state.data.push(action.payload);
      }
    },
  },
});

export const {
  fetchAnalyticsStart,
  fetchAnalyticsSuccess,
  fetchAnalyticsFailure,
  setDateRange,
  setSelectedPlatforms,
  updatePlatformAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
