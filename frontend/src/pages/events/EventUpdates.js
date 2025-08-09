import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Container,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const EventUpdates = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/events', {
          params: {
            limit: 10,
            timeFrame: 'upcoming',
            sort: 'startDate',
          },
        });

        if (response.data.events.length > 0) {
          // Set the first event as featured
          setFeaturedEvent(response.data.events[0]);
          // Set the rest as upcoming events
          setUpcomingEvents(response.data.events.slice(1));
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load event updates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatEventDate = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      // Same day event
      return `${format(start, 'MMM d, yyyy')} · ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else {
      // Multi-day event
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
  };

  const getDaysUntilEvent = (startDate) => {
    const today = new Date();
    const eventDate = new Date(startDate);
    const diffTime = Math.abs(eventDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `${diffDays} days away`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <NotificationsIcon sx={{ mr: 1 }} /> Event Updates
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Stay informed about upcoming events and activities on campus
        </Typography>
        <Divider sx={{ mb: 4 }} />
      </Box>

      {/* Featured Event Banner */}
      {featuredEvent && (
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 3, 
            overflow: 'hidden',
            mb: 6,
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <Grid container>
            <Grid item xs={12} md={6}>
              <CardMedia
                component="img"
                height="100%"
                image={featuredEvent.image || 'https://source.unsplash.com/random?university,event'}
                alt={featuredEvent.title}
                sx={{ 
                  height: { xs: 200, md: '100%' },
                  objectFit: 'cover',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label="Featured Event" 
                    color="secondary" 
                    size="small"
                    sx={{ mb: 1, fontWeight: 500 }}
                  />
                  <Chip 
                    label={getDaysUntilEvent(featuredEvent.startDate)} 
                    color="primary" 
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, mb: 1, fontWeight: 500 }}
                  />
                </Box>
                
                <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                  {featuredEvent.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {formatEventDate(featuredEvent.startDate, featuredEvent.endDate)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LocationIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {featuredEvent.location}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    flexGrow: 1,
                  }}
                >
                  {featuredEvent.description}
                </Typography>
                
                <Button 
                  component={Link} 
                  to={`/events/${featuredEvent._id}`}
                  variant="contained" 
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  size="large"
                  sx={{ 
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  View Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Upcoming Events Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Upcoming Events
          </Typography>
          <Button 
            component={Link} 
            to="/events"
            color="primary"
            endIcon={<KeyboardArrowRight />}
          >
            View All Events
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {upcomingEvents.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              No upcoming events at this time. Check back later!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {upcomingEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={event.image || 'https://source.unsplash.com/random?university,event'}
                    alt={event.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        size="small" 
                        label={event.category} 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        size="small" 
                        label={getDaysUntilEvent(event.startDate)} 
                        color="secondary" 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, my: 1 }} noWrap>
                      {event.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatEventDate(event.startDate, event.endDate)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {event.location}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {event.description}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      component={Link} 
                      to={`/events/${event._id}`} 
                      size="small" 
                      color="primary"
                      endIcon={<EventIcon />}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default EventUpdates;