import reducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout
} from '../../src/store/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginStart', () => {
    expect(reducer(initialState, loginStart())).toEqual({
      ...initialState,
      loading: true,
      error: null,
    });
  });

  it('should handle loginSuccess', () => {
    const user = { email: 'admin@jobtracker.com', name: 'Admin User' };
    expect(reducer({ ...initialState, loading: true }, loginSuccess(user))).toEqual({
      user,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  });

  it('should handle loginFailure', () => {
    const errorMsg = 'Invalid credentials';
    expect(reducer({ ...initialState, loading: true }, loginFailure(errorMsg))).toEqual({
      ...initialState,
      loading: false,
      error: errorMsg,
    });
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { email: 'admin@jobtracker.com', name: 'Admin User' },
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    expect(reducer(loggedInState, logout())).toEqual(initialState);
  });
});
