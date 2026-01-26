import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  Badge,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icons, IconNames } from '../utils/icons';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <FontAwesomeIcon icon={IconNames.faDashboard} />, path: '/' },
  { text: 'Pipelines', icon: <FontAwesomeIcon icon={IconNames.faProjectDiagram} />, path: '/pipelines' },
  { text: 'Executions', icon: <FontAwesomeIcon icon={IconNames.faPlay} />, path: '/executions' },
  { text: 'LLM Configs', icon: <FontAwesomeIcon icon={IconNames.faCog} />, path: '/llm-configs' },
];

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      bgcolor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #e2e8f0',
      overflow: 'auto',
    }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              borderRadius: 3, // Material 3 large corner (16px)
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1.25rem',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            PS
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#0f172a',
              fontSize: '1.125rem',
            }}
          >
            PromptShield
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ width: '100%', px: 2, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 3, // Material 3 large corner (16px)
                minHeight: 52,
                px: 2.5,
                py: 1.5,
                mb: 0.5,
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  backgroundColor: 'linear-gradient(rgba(220, 38, 38, 0.12), rgba(220, 38, 38, 0.12)), #ffffff',
                  color: '#dc2626',
                  borderLeft: '4px solid #dc2626',
                  paddingLeft: '16px',
                  '&:hover': {
                    backgroundColor: 'linear-gradient(rgba(220, 38, 38, 0.16), rgba(220, 38, 38, 0.16)), #ffffff',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#dc2626',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(220, 38, 38, 0.04)',
                  transform: 'translateX(4px)',
                  '& .MuiListItemIcon-root': {
                    color: '#dc2626',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? '#dc2626' : '#64748b',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.9375rem',
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  color: location.pathname === item.path ? '#dc2626' : '#0f172a',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Bottom Section - Settings */}
      <Box sx={{ mt: 'auto', px: 2, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              borderRadius: 3, // Material 3 large corner
              minHeight: 52,
              px: 2.5,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 0.04)',
                transform: 'translateX(4px)',
                '& .MuiListItemIcon-root': {
                  color: '#dc2626',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: '#64748b', minWidth: 40 }}>
              <FontAwesomeIcon icon={IconNames.faCog} />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: '#0f172a',
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          borderBottom: 'none',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
          color: '#0f172a',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(8px)',
          background: 'linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))',
        }}
      >
        <Toolbar sx={{
          minHeight: '72px !important',
          px: { xs: 2, sm: 3 },
          justifyContent: 'space-between',
          gap: 2,
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 1,
              display: { sm: 'none' },
              color: '#0f172a',
            }}
          >
            <FontAwesomeIcon icon={IconNames.faBars} />
          </IconButton>

          {/* Search Bar */}
          <TextField
            placeholder="Search anything"
            variant="outlined"
            size="small"
            sx={{
              flexGrow: 1,
              maxWidth: { xs: '100%', md: '500px' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '28px', // Material 3 extra-large (pill-shaped search)
                backgroundColor: '#f8fafc',
                height: '48px',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                },
                '&:hover fieldset': {
                  borderColor: 'transparent',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#dc2626',
                  borderWidth: '2px',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={IconNames.faSearch} style={{ color: '#64748b', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              sx={{
                color: '#64748b',
                borderRadius: 2,
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: '#dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <FontAwesomeIcon icon={IconNames.faComment} />
            </IconButton>
            <IconButton
              sx={{
                color: '#64748b',
                borderRadius: 2,
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: '#dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Badge badgeContent={3} color="error">
                <FontAwesomeIcon icon={IconNames.faBell} />
              </Badge>
            </IconButton>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                },
              }}
            >
              <FontAwesomeIcon icon={IconNames.faUser} />
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e2e8f0',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e2e8f0',
              top: '72px',
              height: 'calc(100% - 72px)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, sm: 4, md: 5 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '72px',
          bgcolor: '#fef7ff', // Material 3 surface color
          minHeight: 'calc(100vh - 72px)',
          overflow: 'auto',
        }}
      >
        <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
