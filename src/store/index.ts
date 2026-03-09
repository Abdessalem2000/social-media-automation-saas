import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authSlice from './slices/authSlice';
import socialMediaSlice from './slices/socialMediaSlice';
import schedulingSlice from './slices/schedulingSlice';
import analyticsSlice from './slices/analyticsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'socialMedia'],
};

const rootReducer = {
  auth: persistReducer(persistConfig, authSlice),
  socialMedia: socialMediaSlice,
  scheduling: schedulingSlice,
  analytics: analyticsSlice,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
