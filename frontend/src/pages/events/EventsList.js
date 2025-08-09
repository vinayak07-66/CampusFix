import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import EventBanner from './EventBanner';

// Event categories
const categories = [
  'Workshop',
  'Seminar',
  'Conference',
  'Cultural',
  'Sports',
  'Academic',
  'Social',
  'Charity',
  'Other',
];

const EventsList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [timeFrame, setTimeFrame] = useState('upcoming');
  const [showRegistered, setShowRegistered] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate pagination
      const from = (page - 1) * 9;
      const to = from + 8; // 9 items per page (0-8)
      
      // Start building the query
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
      }
      
      if (category) {
        query = query.eq('category', category);
      }
      
      // Apply time frame filter
      const now = new Date().toISOString();
      if (timeFrame === 'upcoming') {
        query = query.gte('start_date', now);
      } else if (timeFrame === 'past') {
        query = query.lt('start_date', now);
      }
      
      // If showing only registered events
      if (showRegistered && user) {
        // First get the event IDs the user is registered for
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (registrations && registrations.length > 0) {
          const eventIds = registrations.map(reg => reg.event_id);
          query = query.in('id', eventIds);
        } else {
          // If user has no registrations, return empty result
          setEvents([]);
          setTotalPages(0);
          setLoading(false);
          return;
        }
      }
      
      // Order by start date
      query = query.order('start_date', { ascending: timeFrame !== 'past' });
      
      // Apply pagination
      const { data, error: supabaseError, count } = await query.range(from, to);
      
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
        image: event.image_url,
        registered: false // Will be updated below if needed
      }));
      
      // Check which events the user is registered for
      if (user) {
        const { data: userRegistrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (userRegistrations && userRegistrations.length > 0) {
          const registeredEventIds = userRegistrations.map(reg => reg.event_id);
          
          // Mark events as registered
          processedEvents.forEach(event => {
            if (registeredEventIds.includes(event._id)) {
              event.registered = true;
            }
          });
        }
      }
      
      setEvents(processedEvents);
      setTotalPages(Math.ceil(count / 9));
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search, category, timeFrame, showRegistered]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleTimeFrameChange = (e) => {
    setTimeFrame(e.target.value);
    setPage(1);
  };

  const toggleRegisteredEvents = () => {
    setShowRegistered(!showRegistered);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setTimeFrame('upcoming');
    setShowRegistered(false);
    setPage(1);
  };

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

  return (
    <Box>
      {/* Event Banner with Featured and Upcoming Events */}
      <EventBanner />
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Browse All Events
        </Typography>
        {user && (user.role === 'admin' || user.role === 'staff') && (
          <Button
            component={Link}
            to="/admin/events/create"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, px: 2 }}
          >
            Create Event
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Events"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={category}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="timeframe-label">Time Frame</InputLabel>
              <Select
                labelId="timeframe-label"
                value={timeFrame}
                label="Time Frame"
                onChange={handleTimeFrameChange}
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="past">Past Events</MenuItem>
                <MenuItem value="all">All Events</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {user && (
                <Button
                  fullWidth
                  variant={showRegistered ? "contained" : "outlined"}
                  color="primary"
                  onClick={toggleRegisteredEvents}
                >
                  {showRegistered ? "My Events" : "All Events"}
                </Button>
              )}
              
              <Tooltip title="Clear all filters">
                <IconButton onClick={clearFilters} color="primary">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            No events found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {search || category || timeFrame !== 'upcoming' || showRegistered
              ? 'Try adjusting your filters to see more events'
              : 'There are no upcoming events scheduled at this time'}
          </Typography>
          {(search || category || timeFrame !== 'upcoming' || showRegistered) && (
            <Button
              variant="outlined"
              color="primary"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id || event.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={event.image || 'https://source.unsplash.com/random?university'}
                    alt={event.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        size="small" 
                        label={event.category} 
                        color="primary" 
                        variant="outlined" 
                        icon={<CategoryIcon />}
                      />
                      {new Date(event.startDate) > new Date() ? (
                        <Chip 
                          size="small" 
                          label="Upcoming" 
                          color="success" 
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="Past" 
                          color="default" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
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
                      WebkitLineClamp: 3,
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
                    {event.registered && (
                      <Chip 
                        size="small" 
                        label="Registered" 
                        color="success" 
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default EventsList;