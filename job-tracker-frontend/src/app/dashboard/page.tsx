'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import CasesIcon from '@mui/icons-material/Cases';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/cards/MetricCard';
import ApplicationsTable from '@/components/tables/ApplicationsTable';
import JobDetailsModal from '@/components/modals/JobDetailsModal';
import { Application } from '@/data/mockData';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchApplications,
  selectTotalApplications,
  selectActiveInterviews,
  selectOffers,
  selectOfferRate,
  selectThisWeek
} from '@/store/slices/applicationsSlice';

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((state: RootState) => state.applications);
  
  const totalApps = useSelector(selectTotalApplications);
  const interviews = useSelector(selectActiveInterviews);
  const offers = useSelector(selectOffers);
  const offerRate = useSelector(selectOfferRate);
  const thisWeek = useSelector(selectThisWeek);

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const handleCloseModal = () => setSelectedApp(null);

  return (
    <DashboardLayout>
      <Box mb={4}>
        <Typography variant="h5" fontWeight="700" mb={0.5}>
          My Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track and manage your job applications
        </Typography>
      </Box>

      <Box 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} 
        gap={3} 
        mb={4}
      >
        <MetricCard
          title="Total Applications"
          value={totalApps}
          subtitle={`${totalApps} total`}
          icon={CasesIcon}
        />
        <MetricCard
          title="Interviews"
          value={interviews}
          subtitle="Active"
          icon={TrackChangesIcon}
        />
        <MetricCard
          title="Offers"
          value={offers}
          subtitle={`${offerRate}% rate`}
          icon={TrendingUpIcon}
        />
        <MetricCard
          title="This Week"
          value={thisWeek}
          subtitle="Last 7 days"
          icon={CalendarTodayIcon}
        />
      </Box>

      <ApplicationsTable
        applications={items}
        onViewDetails={(app) => setSelectedApp(app)}
      />

      <JobDetailsModal
        open={!!selectedApp}
        onClose={handleCloseModal}
        application={selectedApp}
      />
    </DashboardLayout>
  );
}
