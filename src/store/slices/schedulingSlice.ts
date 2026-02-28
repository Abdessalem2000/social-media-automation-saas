import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScheduledPost {
  id: string;
  content: string;
  mediaUrls?: string[];
  platforms: string[];
  scheduledDate: string;
  status: 'scheduled' | 'posted' | 'failed' | 'draft';
  createdAt: string;
  postedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface SchedulingState {
  posts: ScheduledPost[];
  isLoading: boolean;
  error: string | null;
  calendarView: 'month' | 'week' | 'day';
  selectedDate: string | null;
}

const initialState: SchedulingState = {
  posts: [],
  isLoading: false,
  error: null,
  calendarView: 'month',
  selectedDate: null,
};

const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState,
  reducers: {
    createPostStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createPostSuccess: (state, action: PayloadAction<ScheduledPost>) => {
      state.posts.push(action.payload);
      state.isLoading = false;
      state.error = null;
    },
    loadPostsSuccess: (state, action: PayloadAction<ScheduledPost[]>) => {
      state.posts = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    createPostFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    updatePost: (state, action: PayloadAction<Partial<ScheduledPost> & { id: string }>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
      }
    },
    deletePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
    setCalendarView: (state, action: PayloadAction<'month' | 'week' | 'day'>) => {
      state.calendarView = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    updatePostStatus: (state, action: PayloadAction<{ id: string; status: ScheduledPost['status']; postedAt?: string }>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index].status = action.payload.status;
        if (action.payload.postedAt) {
          state.posts[index].postedAt = action.payload.postedAt;
        }
      }
    },
    updatePostEngagement: (state, action: PayloadAction<{ id: string; engagement: ScheduledPost['engagement'] }>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index].engagement = action.payload.engagement;
      }
    },
  },
});

export const {
  createPostStart,
  createPostSuccess,
  loadPostsSuccess,
  createPostFailure,
  updatePost,
  deletePost,
  setCalendarView,
  setSelectedDate,
  updatePostStatus,
  updatePostEngagement,
} = schedulingSlice.actions;

export default schedulingSlice.reducer;
