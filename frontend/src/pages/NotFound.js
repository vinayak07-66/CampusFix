import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{
          p: 5,
          borderRadius: 4,
          textAlign: 'center',
          background: 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 6
          }
        }}
      >
        {/* Animated background elements */}
        <Box 
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0) 70%)',
            animation: 'float 8s infinite ease-in-out',
            zIndex: 0
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0) 70%)',
            animation: 'float 6s infinite ease-in-out',
            animationDelay: '2s',
            zIndex: 0
          }}
        />
        
        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{
              fontSize: { xs: '6rem', md: '10rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              mb: 2,
              animation: 'pulse 2s infinite ease-in-out'
            }}
          >
            404
          </Typography>
          
          <Typography 
            variant="h4" 
            component="h2" 
            sx={{
              fontWeight: 'bold',
              mb: 2,
              background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Page Not Found
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4, 
              maxWidth: '600px', 
              mx: 'auto',
              color: 'text.secondary'
            }}
          >
            Oops! The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable. Please check the URL or navigate back to the homepage.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/"
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 3
                }
              }}
            >
              Back to Home
            </Button>
            
            <Button
              onClick={() => window.history.back()}
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 1
                }
              }}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Additional help section */}
      <Box 
        sx={{
          mt: 6,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1,
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 2
          }
        }}
      >
        <Typography variant="h6" component="h3" gutterBottom color="primary.main">
          Need Help?
        </Typography>
        <Typography variant="body2" paragraph>
          If you believe this is an error with our website, please contact our support team or try one of the following:
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Check the URL for typos
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Clear your browser cache and cookies
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <Link to="/contact" style={{ color: '#1976d2', textDecoration: 'none', position: 'relative' }}>
              Contact our support team
              <Box 
                component="span" 
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  width: '0%',
                  height: '1px',
                  bgcolor: 'primary.main',
                  transition: 'width 0.3s',
                  ':hover': {
                    width: '100%'
                  }
                }}
              />
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFound;