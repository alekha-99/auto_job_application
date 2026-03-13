'use client';

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: typeof SvgIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export default function MetricCard({ title, value, subtitle, icon: Icon, iconColor = '#3b82f6', iconBgColor = '#eff6ff' }: MetricCardProps) {
  return (
    <Card sx={{ p: 1 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="body2" color="text.secondary" fontWeight="500">
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: iconBgColor,
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: iconColor, fontSize: 20 }} />
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="700" mb={1}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}
