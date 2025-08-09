import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Typography,
  Paper,
  Button,
  Skeleton,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Chip,
  Divider,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  CalendarMonth as CalendarIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const EventBanner = () => {
  const theme = useTheme();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get upcoming events ordered by start date
        const now = new Date().toISOString();
        const { data, error: supabaseError } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', now)
          .order('start_date', { ascending: true })
          .limit(10);
        
        if (supabaseError) throw supabaseError;
        
        // Process events to match the expected format
        const processedEvents = data.map(event => ({
          _id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          startDate: event.start_date,
          endDate: event.end_date,
          image: event.image_url || 'https://source.unsplash.com/random?university'
        }));

        // Use the first 3 events as featured
        setFeaturedEvents(processedEvents.slice(0, 3));
        
        // Use the next 5 events as upcoming
        setUpcomingEvents(processedEvents.slice(3, 8));
      } catch (err) {
        console.error('Error fetching events for banner:', err);
        setError('Failed to load featured events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => 
      prevActiveStep === featuredEvents.length - 1 ? 0 : prevActiveStep + 1
    );
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => 
      prevActiveStep === 0 ? featuredEvents.length - 1 : prevActiveStep - 1
    );
  };

  // Auto-rotate featured events
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Set up auto-rotation timer
    if (featuredEvents.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveStep((prevStep) => 
          prevStep === featuredEvents.length - 1 ? 0 : prevStep + 1
        );
      }, 6000); // Change slide every 6 seconds
    }
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [featuredEvents.length]);

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

  const renderFeaturedEventsSkeleton = () => (
    <Paper 
      elevation={0}
      sx={{
        position: 'relative',
        height: 400,
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
    </Paper>
  );

  const renderUpcomingEventsSkeleton = () => (
    <Box sx={{ mt: 4 }}>
      <Skeleton variant="text" width={200} height={40} />
      <Box sx={{ display: 'flex', gap: 2, mt: 2, overflow: 'hidden' }}>
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} sx={{ minWidth: 280, flexShrink: 0 }}>
            <Skeleton variant="rectangular" width="100%" height={120} />
            <CardContent>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box>
        {renderFeaturedEventsSkeleton()}
        {renderUpcomingEventsSkeleton()}
      </Box>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'error.light',
          color: 'error.contrastText',
        }}
      >
        <Typography variant="h6">{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      {/* Featured Events Carousel */}
      {featuredEvents.length > 0 && (
        <Box sx={{ position: 'relative' }}>
          <Paper 
            elevation={3}
            sx={{
              position: 'relative',
              borderRadius: 3,
              overflow: 'hidden',
              mb: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {/* Custom carousel implementation */}
            {featuredEvents.map((event, index) => (
              <Fade 
                key={event._id} 
                in={activeStep === index} 
                timeout={800}
                style={{ 
                  display: activeStep === index ? 'block' : 'none',
                  position: 'relative',
                }}
              >
                <Box sx={{ position: 'relative', height: { xs: 300, sm: 400 } }}>
                  <CardMedia
                    component="img"
                    height="100%"
                    image={event.image || 'https://source.unsplash.com/random?university,event'}
                    alt={event.title}
                    sx={{
                      objectFit: 'cover',
                      filter: 'brightness(0.7)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: { xs: 2, sm: 4 },
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
                      color: 'white',
                    }}
                  >
                    <Chip 
                      label={event.category} 
                      color="primary" 
                      size="small"
                      sx={{ mb: 1, fontWeight: 500 }}
                    />
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        mb: 1,
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'white' }} />
                      <Typography variant="body1">
                        {formatEventDate(event.startDate, event.endDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'white' }} />
                      <Typography variant="body1">
                        {event.location}
                      </Typography>
                    </Box>
                    <Button 
                      component={Link} 
                      to={`/events/${event._id}`}
                      variant="contained" 
                      color="primary"
                      endIcon={<EventIcon />}
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                      }}
                    >
                      View Event
                    </Button>
                  </Box>
                </Box>
              </Fade>
            ))}
            
            {/* Custom navigation controls */}
            <IconButton 
              size="small" 
              onClick={handleNext}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' },
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
              }}
            >
              <KeyboardArrowRight />
            </IconButton>
            
            <IconButton 
              size="small" 
              onClick={handleBack}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' },
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
              }}
            >
              <KeyboardArrowLeft />
            </IconButton>
            
            {/* Custom dots indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {featuredEvents.map((_, index) => (
                <IconButton 
                  key={index}
                  size="small"
                  onClick={() => setActiveStep(index)}
                  sx={{
                    p: 0.5,
                    color: activeStep === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <DotIcon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Upcoming Events Horizontal Scroll */}
      {upcomingEvents.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Upcoming Events
            </Typography>
            <Button 
              component={Link} 
              to="/events"
              color="primary"
              endIcon={<KeyboardArrowRight />}
            >
              View All
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2.5, 
              pb: 2,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}
          >
            {upcomingEvents.map((event) => (
              <Card 
                key={event._id} 
                component={Link} 
                to={`/events/${event._id}`}
                sx={{ 
                  minWidth: 280,
                  maxWidth: 280,
                  flexShrink: 0,
                  textDecoration: 'none',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={event.image || 'https://source.unsplash.com/random?university,event'}
                  alt={event.title}
                />
                <CardContent>
                  <Chip 
                    label={event.category} 
                    color="primary" 
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                    {event.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {formatEventDate(event.startDate, event.endDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {event.location}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EventBanner;