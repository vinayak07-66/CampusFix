import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  Report as ReportIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case 'resolved':
      return <CheckCircleIcon color="success" />;
    case 'in progress':
      return <PendingIcon color="warning" />;
    case 'pending':
      return <PendingIcon color="info" />;
    default:
      return <ErrorIcon color="error" />;
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'resolved':
      return 'success';
    case 'in progress':
      return 'warning';
    case 'pending':
      return 'info';
    default:
      return 'error';
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    recentIssues: [],
    issueStats: { total: 0, pending: 0, inProgress: 0, resolved: 0 },
    upcomingEvents: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Fetch recent issues reported by the user from Supabase
        const { data: issues, error: issuesError } = await supabase
          .from('issues')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (issuesError) throw issuesError;
        
        // Calculate issue statistics for the user
        const { data: allUserIssues, error: statsError } = await supabase
          .from('issues')
          .select('status')
          .eq('user_id', user.id);
        
        if (statsError) throw statsError;
        
        const stats = {
          total: allUserIssues?.length || 0,
          pending: allUserIssues?.filter(issue => issue.status === 'pending').length || 0,
          inProgress: allUserIssues?.filter(issue => issue.status === 'in progress').length || 0,
          resolved: allUserIssues?.filter(issue => issue.status === 'resolved').length || 0,
        };
        
        // Fetch upcoming events the user is registered for
        const today = new Date().toISOString();
        
        // First get the event registrations for this user
        const { data: registrations, error: regError } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (regError) throw regError;
        
        // Then get the actual events
        const eventIds = registrations?.map(reg => reg.event_id) || [];
        
        let events = [];
        if (eventIds.length > 0) {
          const { data: eventData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .in('id', eventIds)
            .gte('date', today)
            .order('date', { ascending: true })
            .limit(3);
          
          if (eventsError) throw eventsError;
          events = eventData || [];
        }
        
        setDashboardData({
          recentIssues: issues || [],
          issueStats: stats,
          upcomingEvents: events,
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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

  const { recentIssues, issueStats, upcomingEvents } = dashboardData;

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/bg.jpg')` }}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Here's an overview of your reported issues and upcoming events.
          </Typography>
        </div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Total Issues
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {issueStats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h3" component="div" color="info.main">
                {issueStats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h3" component="div" color="warning.main">
                {issueStats.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Resolved
              </Typography>
              <Typography variant="h3" component="div" color="success.main">
                {issueStats.resolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              component={Link}
              to="/issues/new"
              startIcon={<AddIcon />}
            >
              Report New Issue
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              component={Link}
              to="/issues"
              startIcon={<ReportIcon />}
            >
              View All Issues
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              component={Link}
              to="/events"
              startIcon={<EventIcon />}
            >
              Browse Events
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Recent Issues */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Recent Issues
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentIssues.length > 0 ? (
                <List>
                  {recentIssues.map((issue) => (
                    <React.Fragment key={issue._id}>
                      <ListItem 
                        alignItems="flex-start"
                        secondaryAction={
                          <Chip 
                            label={issue.status} 
                            color={getStatusColor(issue.status)} 
                            size="small" 
                            icon={getStatusIcon(issue.status)}
                          />
                        }
                      >
                        <ListItemIcon>
                          <ReportIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" component={Link} to={`/issues/${issue._id}`} sx={{ textDecoration: 'none' }}>
                              {issue.title}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {issue.location} • {new Date(issue.createdAt).toLocaleDateString()}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  You haven't reported any issues yet.
                </Typography>
              )}
            </CardContent>
            {recentIssues.length > 0 && (
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  component={Link} 
                  to="/issues"
                  endIcon={<ArrowForwardIcon />}
                >
                  View All Issues
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Your Upcoming Events
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {upcomingEvents.length > 0 ? (
                <List>
                  {upcomingEvents.map((event) => (
                    <React.Fragment key={event._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <EventIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" component={Link} to={`/events/${event._id}`} sx={{ textDecoration: 'none' }}>
                              {event.title}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {new Date(event.date).toLocaleDateString()} • {event.time} • {event.location}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  You're not registered for any upcoming events.
                </Typography>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                component={Link} 
                to="/events"
                endIcon={<ArrowForwardIcon />}
              >
                Browse All Events
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      </div>
    </div>
  );
};

export default Dashboard;