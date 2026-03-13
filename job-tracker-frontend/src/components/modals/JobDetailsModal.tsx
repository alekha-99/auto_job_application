'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import { Application } from '@/data/mockData';

interface JobDetailsModalProps {
  open: boolean;
  onClose: () => void;
  application: Application | null;
}

export default function JobDetailsModal({ open, onClose, application }: JobDetailsModalProps) {
  if (!application) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}> {/* Removed mb={3} from here as it's not needed in DialogTitle */}
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
            {((application.category || application.title) || 'Unknown').charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="700">
              {application.title || application.category || 'Unknown Role'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {application.organization || 'Unknown Company'}
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 4 }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <BusinessIcon fontSize="small" />
            <Typography variant="body2">{application.organization || 'Unknown Company'}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <LocationOnIcon fontSize="small" />
            <Typography variant="body2">{application.location}</Typography>
          </Box>
          <Box bgcolor="grey.50" p={1.5} borderRadius={2}>
            <Typography variant="caption" color="text.secondary" display="block">Salary Range</Typography>
            <Typography variant="body2" fontWeight="600">{application.salaryRaw || 'Not Disclosed'}</Typography>
          </Box>
          <Box bgcolor="grey.50" p={1.5} borderRadius={2}>
            <Typography variant="caption" color="text.secondary" display="block">Date Posted</Typography>
            <Typography variant="body2" fontWeight="600">
              {application.datePosted ? new Date(application.datePosted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <PersonIcon fontSize="small" />
            <Typography variant="body2">{application.experienceLevel || 'Unknown Experience'}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <WorkIcon fontSize="small" />
            <Typography variant="body2">{application.employmentType || 'Unknown Type'}</Typography>
          </Box>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight="600" color="text.secondary" gutterBottom>
            About the Role
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {application.descriptionText || `This is a ${application.employmentType || 'Full Time'} role for a ${application.experienceLevel || 'Professional'} (${application.title || application.category || 'Unknown Role'}).`}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
