import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DailyData } from '@/data/mockData';
import api from '@/services/api';

interface AnalyticsState {
  dailyData: DailyData[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  dailyData: [],
  loading: false,
  error: null,
};

// Fetch from true backend API
export const fetchAnalyticsData = createAsyncThunk(
  'analytics/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics');
      return response.data; // assuming array of DailyData
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyData = action.payload;
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectTotalApplications30Days = (state: { analytics: AnalyticsState }) => 
  state.analytics.dailyData.reduce((sum, day) => sum + day.applications, 0);

export const selectDailyAverage = (state: { analytics: AnalyticsState }) => {
  const data = state.analytics.dailyData;
  if (data.length === 0) return 0;
  const total = selectTotalApplications30Days(state);
  return Number((total / data.length).toFixed(1));
};

export default analyticsSlice.reducer;
