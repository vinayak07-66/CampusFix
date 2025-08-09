import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Container, Box, Typography, Paper, useTheme } from '@mui/material';

const AuthLayout = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.primary.main,
        backgroundImage: 'linear-gradient(135deg, rgba(25, 118, 210, 0.95) 0%, rgba(25, 118, 210, 0.8) 100%)',
        position: 'relative',
      }}
    >
      {/* Background Logo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1,
          backgroundImage: 'url(https://i.ibb.co/WNJMKrDy/College-Logo.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '50%',
          zIndex: 0,
        }}
      />
      
      <Box
        component="header"
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            fontWeight: 700,
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box 
            component="img"
            src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg"
            alt="College Logo"
            sx={{ height: 40, mr: 1 }}
          />
          CampusFix
        </Typography>
      </Box>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexGrow: 1,
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: theme.shape.borderRadius,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Outlet />
        </Paper>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography variant="body2" color="white">
          © {new Date().getFullYear()} CampusFix - Campus Facility Management System
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;