'use client';

import React from 'react';
import { Typography, Paper, Box, useTheme, useMediaQuery } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyData } from '@/data/mockData';

interface ApplicationsChartProps {
  data: DailyData[];
}

export default function ApplicationsChart({ data }: ApplicationsChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" fontWeight="600" mb={3}>
        Applications Per Day (Last 30 Days)
      </Typography>
      
      <Box sx={{ width: '100%', height: isMobile ? 300 : 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.grey[200]} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              interval="preserveStartEnd" // responsive ticks
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: theme.palette.action.hover }}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="applications" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
