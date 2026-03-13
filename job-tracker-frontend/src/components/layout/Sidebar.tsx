'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '@/store/slices/authSlice';

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  isMobile: boolean;
}

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

export default function Sidebar({ mobileOpen, onDrawerToggle, collapsed, onCollapseToggle, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const navItems = [
    { title: 'My Applications', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Analytics', path: '/analytics', icon: <InsertChartIcon /> },
    { title: 'Master Resume', path: '/master-resume', icon: <DescriptionIcon /> },
    { title: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    if (isMobile) {
      onDrawerToggle();
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const currentWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: 'gray.400' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
        <Box sx={{ bgcolor: 'primary.main', p: 0.8, borderRadius: 2, display: 'flex' }}>
          <BusinessCenterIcon fontSize="small" />
        </Box>
        {(!collapsed || isMobile) && (
          <Typography variant="h6" fontWeight="bold">
            JobTracker
          </Typography>
        )}
      </Box>

      <List sx={{ px: 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: active ? 'white' : '#94a3b8',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.2)',
                    color: 'white',
                  },
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  px: collapsed && !isMobile ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed && !isMobile ? 0 : 40 }}>
                  {item.icon}
                </ListItemIcon>
                {(!collapsed || isMobile) && (
                  <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 500 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <Box sx={{ p: 2 }}>
        {(!collapsed || isMobile) && (
           <ListItemButton
           onClick={handleLogout}
           sx={{ borderRadius: 2, color: '#94a3b8', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
         >
           <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem' }} />
         </ListItemButton>
        )}

        {!isMobile && (
          <ListItemButton
            onClick={onCollapseToggle}
            sx={{ borderRadius: 2, color: '#94a3b8', mt: 1, justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>
              {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Collapse" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
          </ListItemButton>
        )}
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: currentWidth }, flexShrink: { md: 0 }, transition: 'width 0.2s' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH, borderRight: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentWidth,
            transition: 'width 0.2s',
            borderRight: 'none',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
