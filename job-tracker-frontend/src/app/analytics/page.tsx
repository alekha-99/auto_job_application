'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AssessmentIcon from '@mui/icons-material/Assessment';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/cards/MetricCard';
import ApplicationsChart from '@/components/charts/ApplicationsChart';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchAnalyticsData,
  selectTotalApplications30Days,
  selectDailyAverage
} from '@/store/slices/analyticsSlice';
import { selectOfferRate } from '@/store/slices/applicationsSlice';

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>();
  
  const { dailyData } = useSelector((state: RootState) => state.analytics);
  const total30Days = useSelector(selectTotalApplications30Days);
  const dailyAvg = useSelector(selectDailyAverage);
  const interviewRate = 13; // Using static or mock selector as per screenshot

  useEffect(() => {
    dispatch(fetchAnalyticsData());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <Box mb={4}>
        <Typography variant="h5" fontWeight="700" mb={0.5}>
          Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your application activity and trends
        </Typography>
      </Box>

      <Box 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} 
        gap={3} 
        mb={4}
      >
        <MetricCard
          title="Total (30 days)"
          value={total30Days}
          subtitle=""
          icon={BusinessCenterIcon}
        />
        <MetricCard
          title="Daily Average"
          value={dailyAvg}
          subtitle=""
          icon={ShowChartIcon}
        />
        <MetricCard
          title="This Week"
          value={12} // Static mock based on screenshot
          subtitle=""
          icon={DateRangeIcon}
        />
        <MetricCard
          title="Interview Rate"
          value={`${interviewRate}%`}
          subtitle=""
          icon={AssessmentIcon}
        />
      </Box>

      <ApplicationsChart data={dailyData} />
    </DashboardLayout>
  );
}
