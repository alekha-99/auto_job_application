import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Application } from '@/data/mockData';
import api from '@/services/api';

interface ApplicationsState {
  items: Application[];
  loading: boolean;
  selectedApplication: Application | null;
  error: string | null;
}

const initialState: ApplicationsState = {
  items: [],
  loading: false,
  selectedApplication: null,
  error: null,
};

// Fetch from true backend API
export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs?limit=100');
      return response.data.data; // extraction of `{ success: true, data: [...] }`
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    selectApplication(state, action: PayloadAction<Application>) {
      state.selectedApplication = action.payload;
    },
    clearSelectedApplication(state) {
      state.selectedApplication = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectApplication, clearSelectedApplication } = applicationsSlice.actions;

// Selectors for Metrics
export const selectTotalApplications = (state: { applications: ApplicationsState }) => state.applications.items.length;
export const selectActiveInterviews = (state: { applications: ApplicationsState }) => 
  state.applications.items.filter(app => app.status === 'Interviewing').length;
export const selectOffers = (state: { applications: ApplicationsState }) => 
  state.applications.items.filter(app => app.status === 'Offered').length;
export const selectOfferRate = (state: { applications: ApplicationsState }) => {
  const total = state.applications.items.length;
  if (total === 0) return 0;
  const offers = selectOffers(state);
  return Math.round((offers / total) * 100);
};
export const selectThisWeek = (state: { applications: ApplicationsState }) => {
  return state.applications.items.filter(app => {
    if (!app.datePosted) return false;
    const diff = new Date().getTime() - new Date(app.datePosted).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length || 0; 
};

export default applicationsSlice.reducer;
