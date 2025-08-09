import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  HowToReg as RegisterIcon,
  Cancel as CancelRegistrationIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/events/${id}`);
      setEvent(response.data);
      setRegistrationStatus(response.data.isRegistered);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return;
    }
    
    try {
      const response = await axios.get(`/api/events/${id}/attendees`);
      setAttendees(response.data);
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event && (user?.role === 'admin' || user?.role === 'staff')) {
      fetchAttendees();
    }
  }, [event, user]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    try {
      setRegistrationLoading(true);
      await axios.post(`/api/events/${id}/register`);
      setRegistrationStatus(true);
    } catch (err) {
      console.error('Error registering for event:', err);
      setError('Failed to register for event. Please try again.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      setRegistrationLoading(true);
      await axios.delete(`/api/events/${id}/register`);
      setRegistrationStatus(false);
    } catch (err) {
      console.error('Error canceling registration:', err);
      setError('Failed to cancel registration. Please try again.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/events/${id}`);
      navigate('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatEventDate = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      // Same day event
      return {
        date: format(start, 'EEEE, MMMM d, yyyy'),
        time: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
      };
    } else {
      // Multi-day event
      return {
        date: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
        time: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
      };
    }
  };

  const isEventPast = () => {
    if (!event) return false;
    return new Date(event.endDate) < new Date();
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    return !isEventPast() && event.registrationDeadline && new Date(event.registrationDeadline) > new Date();
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
      <Box sx={{ my: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          component={Link}
          to="/events"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ my: 3 }}>
        <Alert severity="error">Event not found</Alert>
        <Button
          component={Link}
          to="/events"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  const { date, time } = formatEventDate(event.startDate, event.endDate);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/events"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Events
        </Button>
        <Typography variant="h4" component="h1">
          Event Details
        </Typography>
      </Box>

      {registrationStatus !== null && (
        <Alert 
          severity={registrationStatus ? "success" : "info"} 
          sx={{ mb: 3 }}
        >
          {registrationStatus 
            ? "You are registered for this event" 
            : isRegistrationOpen() 
              ? "You are not registered for this event" 
              : isEventPast() 
                ? "This event has already passed" 
                : "Registration is closed for this event"}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ overflow: 'hidden' }}>
            <Box 
              sx={{ 
                height: 300, 
                backgroundImage: `url(${event.image || 'https://source.unsplash.com/random?university'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0,
                  p: 2,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                }}
              >
                <Chip 
                  label={event.category} 
                  color="primary" 
                  size="small"
                  icon={<CategoryIcon />}
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {event.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {date}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {time}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {event.location}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                About This Event
              </Typography>
              
              <Typography variant="body1" paragraph>
                {event.description}
              </Typography>
              
              {event.additionalInfo && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Additional Information
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {event.additionalInfo}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Registration
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Registration Deadline
              </Typography>
              <Typography variant="body1">
                {event.registrationDeadline 
                  ? format(new Date(event.registrationDeadline), 'MMMM d, yyyy h:mm a')
                  : 'No deadline specified'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Capacity
              </Typography>
              <Typography variant="body1">
                {event.capacity ? `${event.registeredCount || 0} / ${event.capacity}` : 'Unlimited'}
              </Typography>
            </Box>
            
            {user && (
              <Box sx={{ mt: 3 }}>
                {registrationStatus ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<CancelRegistrationIcon />}
                    onClick={handleCancelRegistration}
                    disabled={registrationLoading || isEventPast()}
                  >
                    {registrationLoading ? 'Processing...' : 'Cancel Registration'}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<RegisterIcon />}
                    onClick={handleRegister}
                    disabled={
                      registrationLoading || 
                      isEventPast() || 
                      !isRegistrationOpen() || 
                      (event.capacity && event.registeredCount >= event.capacity)
                    }
                  >
                    {registrationLoading 
                      ? 'Processing...' 
                      : isEventPast() 
                        ? 'Event Ended' 
                        : !isRegistrationOpen() 
                          ? 'Registration Closed' 
                          : (event.capacity && event.registeredCount >= event.capacity) 
                            ? 'Event Full' 
                            : 'Register Now'}
                  </Button>
                )}
              </Box>
            )}
            
            {!user && (
              <Box sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  component={Link}
                  to={`/login?redirect=/events/${id}`}
                  startIcon={<RegisterIcon />}
                  disabled={isEventPast() || !isRegistrationOpen() || (event.capacity && event.registeredCount >= event.capacity)}
                >
                  Login to Register
                </Button>
              </Box>
            )}
          </Paper>
          
          {user && (user.role === 'admin' || user.role === 'staff') && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Admin Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  component={Link}
                  to={`/admin/events/edit/${id}`}
                  fullWidth
                >
                  Edit Event
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  fullWidth
                >
                  Delete Event
                </Button>
                
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<GroupIcon />}
                  onClick={() => setShowAttendees(!showAttendees)}
                  fullWidth
                >
                  {showAttendees ? 'Hide Attendees' : 'View Attendees'}
                </Button>
              </Box>
              
              {showAttendees && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Registered Attendees ({attendees.length})
                  </Typography>
                  
                  {attendees.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No attendees registered yet
                    </Typography>
                  ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {attendees.map((attendee) => (
                        <ListItem key={attendee._id}>
                          <ListItemAvatar>
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={attendee.name}
                            secondary={attendee.email}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Paper>
          )}
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Organizer
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="body1">
                  {event.organizer?.name || 'Campus Administration'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.organizer?.department || 'Event Organizer'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteEvent} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading && <CircularProgress size={20} />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetail;