import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';

import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Event as EventIcon,
  Report as ReportIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Login as LoginIcon,   // ✅ moved here
} from '@mui/icons-material';

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleCloseUserMenu();
  };

  // Navigation items based on authentication and role
  const getNavigationItems = () => {
    const items = [
      { text: 'Home', icon: <HomeIcon />, path: '/' },
      { text: 'About', icon: <InfoIcon />, path: '/about' },
      { text: 'Contact', icon: <EmailIcon />, path: '/contact' },
      { text: 'Events', icon: <EventIcon />, path: '/events' },
    ];

    const isAdmin = user?.role === 'admin' || user?.role === 'staff';

    if (isAuthenticated) {
      items.push(
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }
      );

      if (!isAdmin) {
        // Keep only one Report section in navbar
        items.push(
          { text: 'Report Issues', icon: <ReportIcon />, path: '/reports/create' }
        );
      }

      if (isAdmin) {
        items.push({ text: 'Admin Panel', icon: <AdminIcon />, path: '/admin' });
      }
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <img src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="College Logo" style={{ height: 60, marginBottom: 8 }} />
        <Typography variant="h6" component="div">
          CampusFix
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            
            <Box
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <img src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="College Logo" style={{ height: 40, marginRight: 10 }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                }}
              >
                CampusFix
              </Typography>
            </Box>

            <Box
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                flexGrow: 1,
              }}
            >
              <img src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="College Logo" style={{ height: 30, marginRight: 8 }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                CampusFix
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {navigationItems.map((item) => (
                <Box key={item.text} sx={{ position: 'relative', '&:hover .tooltip': { opacity: 1 } }}>
                  <Button
                    component={Link}
                    to={item.path}
                    sx={{
                      my: 2,
                      mx: 0.5,
                      color: 'white',
                      display: 'block',
                      borderRadius: '8px',
                      transition: 'all 0.3s',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '6px 16px',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        backgroundColor: 'primary.dark',
                        boxShadow: 3,
                        borderColor: 'rgba(255, 255, 255, 0.6)'
                      }
                    }}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </Button>
                  <Box
                    className="tooltip"
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bottom: '-20px',
                      bgcolor: 'grey.800',
                      color: 'white',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      py: 0.5,
                      px: 1,
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 50
                    }}
                  >
                    Go to {item.text}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              {isAuthenticated ? (
                <>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar alt={user?.name} src={user?.profileImage} />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    <MenuItem component={Link} to="/profile" onClick={handleCloseUserMenu}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography textAlign="center">Profile</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  startIcon={<LoginIcon />}
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="College Logo" style={{ height: 40 }} />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CampusFix - Fault Reporting and Management System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;