'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper } from '@mui/material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '@/services/api';

export default function MasterResumePage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMasterResumePdf = async () => {
      try {
        const response = await api.get('/resume/master/pdf', { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err: any) {
        console.error('Failed to fetch master resume pdf:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMasterResumePdf();
  }, []);

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'Master_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('PDF uploaded successfully! You can now generate tailored resumes for your jobs.');
      
      // Re-fetch the PDF to view it
      try {
        const pdfResponse = await api.get('/resume/master/pdf', { responseType: 'blob' });
        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e) {
        console.error("Failed to fetch updated PDF");
      }
      
    } catch (err: any) {
      console.error('Failed to upload PDF:', err);
      setError(err.response?.data?.message || 'Failed to upload and parse PDF. Please try again.');
    } finally {
      setIsSaving(false);
      // Reset the file input so the user can upload the same file again if needed
      if (event.target) event.target.value = '';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 2 }}>
        <Typography variant="h4" fontWeight="700" mb={1} color="primary.main">
          Master Resume
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Paste your comprehensive, foundational resume here. JobTracker&apos;s AI will use this as the source of truth to generate highly-tailored, ATS-optimized resumes for each specific job you apply to.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              {pdfUrl ? (
                <Box sx={{ height: 600, width: '100%', mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
                    <Box p={3} textAlign="center">
                      <Typography variant="body1">Your browser does not support PDFs.</Typography>
                    </Box>
                  </object>
                </Box>
              ) : (
                <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, mb: 2, border: '1px dashed', borderColor: 'divider' }}>
                  <Typography color="text.secondary" variant="h6">No Master Resume PDF found.</Typography>
                  <Typography color="text.secondary" variant="body2" mt={1}>Please upload a PDF document below to get started.</Typography>
                </Box>
              )}
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <input
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="raised-button-file">
                    <Button
                      variant="outlined"
                      component="span"
                      color="secondary"
                      size="large"
                      disabled={isSaving}
                      startIcon={<UploadFileIcon />}
                      sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Upload PDF
                    </Button>
                  </label>
                </Box>
                
                {pdfUrl && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleDownloadPdf}
                    startIcon={<DescriptionIcon />}
                    sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Download Master PDF
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
}
