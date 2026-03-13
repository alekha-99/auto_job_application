'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="60vh"
        textAlign="center"
      >
        <Typography variant="h4" fontWeight="700" mb={2}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Settings configuration coming soon.
        </Typography>
      </Box>
    </DashboardLayout>
  );
}
