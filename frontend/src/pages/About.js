import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Avatar, Divider, Paper } from '@mui/material';
import { School as SchoolIcon, Build as BuildIcon, People as PeopleIcon, EmojiEvents as EventsIcon } from '@mui/icons-material';

const About = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative',
          height: '300px', 
          borderRadius: 4,
          overflow: 'hidden',
          mb: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("/bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: 3,
          animation: 'gradientShift 10s ease infinite',
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'scale(1.01)'
          }
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white', p: 4, maxWidth: '800px' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            About CampusFix
          </Typography>
          <Typography variant="h6">
            Connecting students, staff, and administration to create a better campus experience
          </Typography>
        </Box>
      </Box>

      {/* Mission Statement */}
      <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph sx={{ textAlign: 'center' }}>
          CampusFix is dedicated to improving campus life by providing a streamlined platform for reporting and resolving issues, 
          organizing events, and fostering communication between all members of our campus community.
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center' }}>
          We believe that a well-maintained and vibrant campus environment is essential for academic success and personal growth.
        </Typography>
      </Paper>

      {/* Features Section */}
      <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        What We Offer
      </Typography>
      
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-10px)', boxShadow: 6 } }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                <BuildIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" component="h3" gutterBottom>
                Issue Reporting
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Easily report campus issues and track their resolution status in real-time.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-10px)', boxShadow: 6 } }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                <EventsIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" component="h3" gutterBottom>
                Event Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Discover, register for, and stay updated on campus events and activities.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-10px)', boxShadow: 6 } }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                <PeopleIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" component="h3" gutterBottom>
                Community Engagement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect with other students and staff to build a stronger campus community.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-10px)', boxShadow: 6 } }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                <SchoolIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" component="h3" gutterBottom>
                Campus Resources
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access important information and resources to enhance your campus experience.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Section */}
      <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Our Team
      </Typography>
      
      <Grid container spacing={6} sx={{ mb: 6 }}>
        {[
                            ].map((member, index) => (
          <Grid item xs={12} sm={4} md={3} key={index}>
            <Card sx={{ 
              height: '100%', 
              transition: 'all 0.3s', 
              '&:hover': { 
                transform: 'translateY(-10px)', 
                boxShadow: 6 
              } 
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar 
                  src={member.avatar} 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mx: 'auto', 
                    mb: 2,
                    border: '3px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {member.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" component="h3" gutterBottom>
                  {member.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {member.role}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 6 }} />

      {/* Contact Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Get In Touch
        </Typography>
        <Typography variant="body1">
          Have questions or suggestions? We'd love to hear from you!
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Email: <strong>contact@campusfix.edu</strong>
        </Typography>
        <Typography variant="body1">
          Phone: <strong>020 27653168</strong>
        </Typography>
      </Box>
    </Container>
  );
};

export default About;