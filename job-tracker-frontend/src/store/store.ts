import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import applicationsReducer from './slices/applicationsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
