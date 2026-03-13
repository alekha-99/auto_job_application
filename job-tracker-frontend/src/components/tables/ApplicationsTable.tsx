'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Avatar,
  Box,
  Typography,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { Application } from '@/data/mockData';
import api from '@/services/api';

interface ApplicationsTableProps {
  applications: Application[];
  onViewDetails: (app: Application) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Interviewing': return { bg: '#fff7ed', color: '#c2410c' }; // Orange
    case 'Offered': return { bg: '#f0fdf4', color: '#15803d' }; // Green
    case 'Saved': return { bg: '#f3e8ff', color: '#7e22ce' }; // Purple
    case 'Applied': return { bg: '#f1f5f9', color: '#475569' }; // Slate
    case 'New': return { bg: '#eff6ff', color: '#1d4ed8' }; // Blue
    default: return { bg: '#f1f5f9', color: '#475569' };
  }
};

export default function ApplicationsTable({ applications, onViewDetails }: ApplicationsTableProps) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 15;
  const [generatedResumeIds, setGeneratedResumeIds] = useState<Set<string>>(new Set());
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [fetchingResumeId, setFetchingResumeId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  React.useEffect(() => {
    const fetchGeneratedResumes = async () => {
      try {
        const response = await api.get('/resume/generated');
        if (response.data?.success) {
          const ids = new Set<string>(response.data.data.map((r: any) => r.jobId));
          setGeneratedResumeIds(ids);
        }
      } catch (err) {
        console.error('Failed to fetch generated resumes:', err);
      }
    };
    fetchGeneratedResumes();
  }, []);

  const handleGenerateClick = async (jobId: string) => {
    setGeneratingId(jobId);
    try {
      await api.post(`/resume/generate/${jobId}`);
      setGeneratedResumeIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(jobId);
        return newSet;
      });
    } catch (err: any) {
      console.error('Failed to generate resume:', err);
      alert(err.response?.data?.message || 'Failed to generate resume. Please ensure you have saved a Master Resume first.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadResume = async (jobId: string) => {
    setFetchingResumeId(jobId);
    try {
      const response = await api.get(`/resume/generated/${jobId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'ATS_Tailored_Resume.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch?.length === 2) fileName = fileNameMatch[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download generated resume:', err);
      alert('Failed to download resume. Please try again.');
    } finally {
      setFetchingResumeId(null);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const paginatedApps = applications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="600">
          Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {applications.length} results
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
        <Table stickyHeader sx={{ minWidth: 1000 }} aria-label="applications table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 200 }}>Company</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 150 }}>Position</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>Description</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 120 }}>Location</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 120 }}>Salary</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>Status</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>Resume</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>Date</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }} align="center">Apply</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApps.map((app) => {
              const statusColors = getStatusColor(app.status || 'New');
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={app.id}>
                  <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={app.organization || 'Unknown Company'} placement="top">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'white', fontSize: '0.875rem', flexShrink: 0 }}>
                          {(app.category || app.title || 'Unknown Role').charAt(0)}
                        </Avatar>
                        <Box ml={2} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Typography variant="subtitle2" fontWeight="600" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.organization || 'Unknown Company'}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{app.title || app.category || 'Unknown Role'}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, whiteSpace: 'nowrap' }}
                      onClick={() => onViewDetails(app)}
                    >
                      View Details
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={app.location || ''} placement="top">
                      <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.location}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={app.salaryRaw || 'Not Disclosed'} placement="top">
                      <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.salaryRaw || 'Not Disclosed'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Chip 
                      label={app.status || 'New'} 
                      size="small" 
                      sx={{ 
                        bgcolor: statusColors.bg, 
                        color: statusColors.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        whiteSpace: 'nowrap'
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {generatedResumeIds.has(String(app.id)) ? (
                      <Button
                        variant="text"
                        size="small"
                        color="success"
                        disabled={fetchingResumeId === String(app.id)}
                        onClick={() => handleDownloadResume(String(app.id))}
                        startIcon={fetchingResumeId === String(app.id) ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon fontSize="small" />}
                        sx={{
                          textTransform: 'none',
                          minWidth: 100,
                          justifyContent: 'flex-start',
                          whiteSpace: 'nowrap',
                          fontWeight: 600
                        }}
                      >
                        {fetchingResumeId === String(app.id) ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    ) : (
                      <Button 
                        variant="text" 
                        size="small" 
                        onClick={() => handleGenerateClick(String(app.id))}
                        disabled={generatingId === String(app.id)}
                        startIcon={
                          generatingId === String(app.id) ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <DescriptionIcon fontSize="small" />
                          )
                        }
                        sx={{ 
                          textTransform: 'none', 
                          color: 'primary.main',
                          minWidth: 100,
                          justifyContent: 'flex-start',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {generatingId === String(app.id) ? 'Generating...' : 'Generate'}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      {app.datePosted ? new Date(app.datePosted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                      sx={{ textTransform: 'none', px: 2, borderRadius: 2, whiteSpace: 'nowrap' }}
                      disabled={(app.status || 'New') === 'Applied' || (app.status || 'New') === 'Interviewing' || (app.status || 'New') === 'Offered'}
                    >
                      {['Applied', 'Interviewing', 'Offered'].includes(app.status || 'New') ? 'Applied' : 'Apply Now'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[15]}
        component="div"
        count={applications.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          '.MuiTablePagination-toolbar': {
            justifyContent: 'center',
            width: '100%'
          },
          '.MuiTablePagination-spacer': {
            display: 'none'
          }
        }}
      />

    </Paper>
  );
}
