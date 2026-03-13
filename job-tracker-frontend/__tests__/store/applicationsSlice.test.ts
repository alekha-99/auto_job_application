import reducer, {
  selectApplication,
  clearSelectedApplication
} from '../../src/store/slices/applicationsSlice';
import { Application } from '../../src/data/mockData';

describe('applicationsSlice', () => {
  const initialState = {
    items: [],
    loading: false,
    selectedApplication: null,
    error: null,
  };

  const mockApp: Application = {
    id: '1',
    organization: 'TestCorp',
    title: 'Dev',
    location: 'Remote',
    salaryRaw: '$100k - $120k',
    status: 'Applied',
    datePosted: '2026-01-01',
    experienceLevel: 'Mid Level',
    employmentType: 'Full Time',
    descriptionText: 'Test description',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle selectApplication', () => {
    expect(reducer(initialState, selectApplication(mockApp))).toEqual({
      ...initialState,
      selectedApplication: mockApp,
    });
  });

  it('should handle clearSelectedApplication', () => {
    const stateWithSelection = {
      ...initialState,
      selectedApplication: mockApp,
    };
    expect(reducer(stateWithSelection, clearSelectedApplication())).toEqual({
      ...initialState,
      selectedApplication: null,
    });
  });
});
