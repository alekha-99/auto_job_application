'use client';

import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AuthGuard from '../auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const sidebarWidth = collapsed && !isMobile ? 80 : 260;

  return (
    <AuthGuard>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        
        <Sidebar 
          mobileOpen={mobileOpen} 
          onDrawerToggle={handleDrawerToggle} 
          collapsed={collapsed}
          onCollapseToggle={handleCollapseToggle}
          isMobile={isMobile}
        />
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flexGrow: 1, 
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          minWidth: 0 // Prevents flex children from blowing out container
        }}>
          <TopBar 
            onDrawerToggle={handleDrawerToggle} 
            isMobile={isMobile} 
            sidebarWidth={sidebarWidth}
          />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3, md: 4 },
              mt: '72px', // matches TopBar height
              minWidth: 0,
              overflowX: 'auto'
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}
