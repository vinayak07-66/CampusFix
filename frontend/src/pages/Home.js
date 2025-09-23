import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Paper,
} from '@mui/material';
import {
  Report as ReportIcon,
  Event as EventIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: 'Report Campus Issues',
      description: 'Easily report maintenance issues, broken facilities, or any campus problems with photos and videos.',
      icon: <ReportIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Track Issue Status',
      description: 'Follow the progress of your reported issues from submission to resolution.',
      icon: <DashboardIcon fontSize="large" color="primary" />,
    },
    {
      title: 'Campus Events',
      description: 'Stay updated with upcoming campus events and register for participation.',
      icon: <EventIcon fontSize="large" color="primary" />,
      link: '/events'
    },
    {
      title: 'Event Updates',
      description: 'Get the latest updates on upcoming events with featured banners and quick links.',
      icon: <EventIcon fontSize="large" color="primary" />,
      link: '/event-updates'
    },
    {
      title: 'Student-Focused',
      description: 'Designed specifically for students to improve campus life and maintenance.',
      icon: <SchoolIcon fontSize="large" color="primary" />,
    },
  ];

  return (
    <Box className="page-fade">
      {/* Hero Section */}
      <Box 
        sx={{
          position: 'relative',
          color: 'white',
          py: 8,
          borderRadius: { xs: 0, md: '0 0 50px 50px' },
          boxShadow: 3,
          minHeight: { xs: '60vh', md: '70vh' },
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `url('/login-bg.jpg')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.35)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box component={Link} to="/" sx={{ display: 'inline-block', mb: 2 }}>
                <Box component="img" src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="PCCOER Logo" sx={{ height: 56, width: 56, borderRadius: '50%', bgcolor: 'white', p: 1, boxShadow: 3 }} />
              </Box>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                CampusFix
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                Report, Track, and Resolve Campus Issues
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                A comprehensive platform for students to report campus maintenance issues,
                track their resolution status, and stay updated with campus events.
              </Typography>
              <Stack direction="row" spacing={2}>
                {isAuthenticated ? (
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    component={Link}
                    to="/dashboard"
                    startIcon={<DashboardIcon />}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      size="large"
                      component={Link}
                      to="/login"
                    >
                      Login
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      size="large"
                      component={Link}
                      to="/register"
                    >
                      Register
                    </Button>
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                component="img"
                src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" 
                alt="College Logo"
                sx={{
                  width: '80%',
                  height: 'auto',
                  maxHeight: 400,
                  display: { xs: 'none', md: 'block' },
                  margin: '0 auto',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  p: 2,
                  objectFit: 'contain',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Key Features
        </Typography>
        <Typography variant="body1" align="center" paragraph sx={{ mb: 6 }}>
          Discover how CampusFix can help improve your campus experience
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                component={feature.link ? Link : 'div'}
                to={feature.link}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                    cursor: feature.link ? 'pointer' : 'default',
                  },
                  textDecoration: 'none'
                }}
                elevation={2}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  {feature.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h3" align="center">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ mb: 6 }}>
            Simple steps to report and track campus issues
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  borderTop: 5, 
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="h6" component="h3" gutterBottom>
                  1. Report an Issue
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Log in to your account, navigate to the issues section, and fill out the
                  report form with details about the problem. Add photos or videos to help
                  maintenance staff understand the issue better.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  borderTop: 5, 
                  borderColor: 'secondary.main',
                }}
              >
                <Typography variant="h6" component="h3" gutterBottom>
                  2. Track Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor the status of your reported issues through your dashboard.
                  Receive updates as maintenance staff review, assign, and work on
                  resolving the problem.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  borderTop: 5, 
                  borderColor: 'success.main',
                }}
              >
                <Typography variant="h6" component="h3" gutterBottom>
                  3. Resolution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Once the issue is resolved, you'll receive a notification. You can
                  provide feedback on the resolution to help improve the maintenance
                  process for future issues.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to improve your campus?
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 4 }}>
          Join CampusFix today and help make your campus a better place for everyone.
        </Typography>
        {!isAuthenticated && (
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            to="/register"
          >
            Get Started
          </Button>
        )}
      </Container>
    </Box>
  );
};

export default Home;