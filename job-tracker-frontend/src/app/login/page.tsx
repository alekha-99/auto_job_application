'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, useTheme } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { loginThunk } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store/store';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@jobtracker.com');
  const [password, setPassword] = useState('password123');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const theme = useTheme();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      router.push('/dashboard');
    } catch (err: any) {
      // Error is automatically handled in the Redux slice and displayed via the `error` state variable.
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 1,
                borderRadius: 2,
                display: 'flex',
              }}
            >
              <BusinessCenterIcon />
            </Box>
            <Typography variant="h5" fontWeight="700">
              JobTracker
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" textAlign="center" mb={2}>
            Sign in to track your job applications
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1, py: 1.5, fontSize: '1rem' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
            (Test credentials pre-filled)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
