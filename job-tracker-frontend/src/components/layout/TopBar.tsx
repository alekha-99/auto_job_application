'use client';

import React from 'react';
import { AppBar, Toolbar, IconButton, InputBase, Badge, Button, Box, Paper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AddIcon from '@mui/icons-material/Add';

interface TopBarProps {
  onDrawerToggle: () => void;
  isMobile: boolean;
  sidebarWidth: number;
}

export default function TopBar({ onDrawerToggle, isMobile, sidebarWidth }: TopBarProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'width 0.2s, margin 0.2s',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '72px !important', px: { xs: 2, sm: 4 } }}>
        <Box display="flex" alignItems="center" flex={1} gap={2}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Search Input */}
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', sm: 400 },
              borderRadius: 2,
              boxShadow: 'none',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <IconButton sx={{ p: '10px', color: 'text.secondary' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1, fontSize: '0.9rem' }}
              placeholder="Search company, position, location..."
              inputProps={{ 'aria-label': 'search applications' }}
            />
          </Paper>
        </Box>

        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 3 }}>
          <IconButton sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={0} color="error" variant="dot">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableElevation
            sx={{ 
              borderRadius: 2, 
              display: { xs: 'none', sm: 'flex' } 
            }}
          >
            Add Application
          </Button>

          {/* Mobile minimal add button */}
          <IconButton 
            color="primary" 
            sx={{ 
              display: { xs: 'flex', sm: 'none' },
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
