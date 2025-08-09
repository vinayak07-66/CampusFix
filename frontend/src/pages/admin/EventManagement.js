import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Event categories
const categories = [
  'Workshop',
  'Seminar',
  'Conference',
  'Cultural',
  'Sports',
  'Academic',
  'Social',
  'Other',
];

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [eventStats, setEventStats] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        search: search || undefined,
        category: categoryFilter || undefined,
        timeFrame: timeFilter !== 'all' ? timeFilter : undefined,
      };

      const response = await axios.get('/api/events', { params });
      setEvents(response.data.events);
      setTotalEvents(response.data.totalEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/admin/events/stats');
      setEventStats(response.data);
    } catch (err) {
      console.error('Error fetching event statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchEventStats();
  }, [page, rowsPerPage, search, categoryFilter, timeFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(0);
  };

  const handleTimeFilterChange = (e) => {
    setTimeFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setTimeFilter('all');
    setPage(0);
  };

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleViewAttendees = async (event) => {
    setSelectedEvent(event);
    setAttendeesDialogOpen(true);
    setAttendeesLoading(true);
    
    try {
      const response = await axios.get(`/api/events/${event._id}/attendees`);
      setAttendees(response.data.attendees);
    } catch (err) {
      console.error('Error fetching attendees:', err);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setDeleteLoading(true);

      await axios.delete(`/api/events/${selectedEvent._id}`);
      
      // Remove the event from the local state
      setEvents(events.filter(event => event._id !== selectedEvent._id));
      setTotalEvents(prev => prev - 1);
      
      setDeleteDialogOpen(false);
      fetchEventStats(); // Refresh stats after delete
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      setDeleteLoading(false);
    }
  };

  // Format date for display
  const formatEventDate = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return format(start, 'MMM d, yyyy');
    }
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  // Format time for display
  const formatEventTime = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  // Check if event is upcoming, ongoing, or past
  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return { label: 'Upcoming', color: 'info' };
    } else if (now >= start && now <= end) {
      return { label: 'Ongoing', color: 'success' };
    } else {
      return { label: 'Past', color: 'default' };
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Event Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/admin/events/create"
        >
          Create Event
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Event Statistics */}
      {!statsLoading && eventStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
                <Typography variant="h4" color="info.main">{eventStats.upcomingEvents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Ongoing Events</Typography>
                <Typography variant="h4" color="success.main">{eventStats.ongoingEvents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Past Events</Typography>
                <Typography variant="h4" color="text.secondary">{eventStats.pastEvents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Registrations</Typography>
                <Typography variant="h4" color="primary.main">{eventStats.totalRegistrations}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Events"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by title or location"
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
                        setPage(0);
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
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={handleCategoryFilterChange}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="time-filter-label">Time Frame</InputLabel>
              <Select
                labelId="time-filter-label"
                value={timeFilter}
                label="Time Frame"
                onChange={handleTimeFilterChange}
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="upcoming">Upcoming Events</MenuItem>
                <MenuItem value="ongoing">Ongoing Events</MenuItem>
                <MenuItem value="past">Past Events</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                disabled={!search && !categoryFilter && timeFilter === 'all'}
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Registrations</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No events found
                    </Typography>
                    {(search || categoryFilter || timeFilter !== 'all') && (
                      <Button
                        variant="text"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                        sx={{ mt: 1 }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => {
                  const status = getEventStatus(event.startDate, event.endDate);
                  const registrationPercentage = Math.round((event.registrations / event.capacity) * 100);
                  
                  return (
                    <TableRow key={event._id} hover>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {event.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={event.category} 
                          icon={<CategoryIcon />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatEventDate(event.startDate, event.endDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatEventTime(event.startDate, event.endDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {event.location}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={status.label} 
                          color={status.color}
                        />
                      </TableCell>
                      <TableCell>
                        {event.capacity}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {event.registrations}/{event.capacity}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`${registrationPercentage}%`} 
                            color={registrationPercentage >= 90 ? 'error' : 
                                  registrationPercentage >= 75 ? 'warning' : 
                                  registrationPercentage >= 50 ? 'info' : 'default'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              component={Link}
                              to={`/events/${event._id}`}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Event">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              component={Link}
                              to={`/admin/events/edit/${event._id}`}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Attendees">
                            <IconButton 
                              size="small" 
                              color="info" 
                              onClick={() => handleViewAttendees(event)}
                            >
                              <GroupIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Event">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteClick(event)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalEvents}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* View Attendees Dialog */}
      <Dialog 
        open={attendeesDialogOpen} 
        onClose={() => setAttendeesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ mr: 1 }} />
            Event Attendees
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedEvent.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {formatEventDate(selectedEvent.startDate, selectedEvent.endDate)}
                <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', ml: 1, mr: 0.5 }} />
                {selectedEvent.location}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {attendeesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : attendees.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
                  No attendees registered for this event yet.
                </Typography>
              ) : (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    {attendees.length} {attendees.length === 1 ? 'person' : 'people'} registered
                  </Typography>
                  <List>
                    {attendees.map((attendee) => (
                      <ListItem key={attendee._id} divider>
                        <ListItemAvatar>
                          <Avatar src={attendee.profilePicture}>
                            {attendee.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={attendee.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {attendee.email}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2" color="text.secondary">
                                {attendee.department} • Student ID: {attendee.studentId}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendeesDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event? This action cannot be undone and will cancel all registrations.
          </DialogContentText>
          {selectedEvent && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1">{selectedEvent.title}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary">
                <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {formatEventDate(selectedEvent.startDate, selectedEvent.endDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {selectedEvent.location}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <GroupIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {selectedEvent.registrations} registered attendees
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteEvent} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventManagement;