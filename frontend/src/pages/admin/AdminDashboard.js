import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  //CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  People as PeopleIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  HourglassEmpty as InProgressIcon,
  Category as CategoryIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending':
      return <PendingIcon color="warning" />;
    case 'In Progress':
      return <InProgressIcon color="info" />;
    case 'Resolved':
      return <CheckCircleIcon color="success" />;
    default:
      return <BugReportIcon />;
  }
};

// Helper function to get random colors for charts
const getRandomColors = (count) => {
  const colors = [
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(40, 159, 64, 0.6)',
    'rgba(210, 199, 199, 0.6)',
  ];
  
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/admin/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { 
    issueStats, 
    userStats, 
    eventStats, 
    recentIssues, 
    categoryDistribution, 
    statusDistribution,
    monthlyIssues,
  } = dashboardData;

  // Prepare data for category distribution chart
  const categoryChartData = {
    labels: Object.keys(categoryDistribution),
    datasets: [
      {
        data: Object.values(categoryDistribution),
        backgroundColor: getRandomColors(Object.keys(categoryDistribution).length),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for status distribution chart
  const statusChartData = {
    labels: Object.keys(statusDistribution),
    datasets: [
      {
        data: Object.values(statusDistribution),
        backgroundColor: [
          'rgba(255, 159, 64, 0.6)', // Pending
          'rgba(54, 162, 235, 0.6)', // In Progress
          'rgba(75, 192, 192, 0.6)', // Resolved
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for monthly issues chart
  const monthlyIssuesChartData = {
    labels: Object.keys(monthlyIssues),
    datasets: [
      {
        label: 'Issues Reported',
        data: Object.values(monthlyIssues),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const monthlyIssuesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Issue Reports',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <BugReportIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Issues
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {issueStats.total}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  size="small" 
                  icon={<PendingIcon />} 
                  label={`${issueStats.pending} Pending`} 
                  color="warning" 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  icon={<InProgressIcon />} 
                  label={`${issueStats.inProgress} In Progress`} 
                  color="info" 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  icon={<CheckCircleIcon />} 
                  label={`${issueStats.resolved} Resolved`} 
                  color="success" 
                  variant="outlined" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Users
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {userStats.total}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  size="small" 
                  label={`${userStats.students} Students`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  label={`${userStats.staff} Staff`} 
                  color="secondary" 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  label={`${userStats.admin} Admins`} 
                  color="error" 
                  variant="outlined" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <EventIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Events
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {eventStats.total}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  size="small" 
                  icon={<CalendarIcon />} 
                  label={`${eventStats.upcoming} Upcoming`} 
                  color="success" 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  label={`${eventStats.registrations} Registrations`} 
                  color="info" 
                  variant="outlined" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Resolution Rate
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {issueStats.resolutionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Resolution Time: {issueStats.avgResolutionTime}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Recent Issues */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Issue Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar data={monthlyIssuesChartData} options={monthlyIssuesOptions} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Issues by Category
                </Typography>
                <Box sx={{ height: 260, display: 'flex', justifyContent: 'center' }}>
                  <Pie data={categoryChartData} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Issues by Status
                </Typography>
                <Box sx={{ height: 260, display: 'flex', justifyContent: 'center' }}>
                  <Pie data={statusChartData} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Issues
              </Typography>
              <Button 
                component={Link} 
                to="/admin/issues" 
                size="small" 
                color="primary"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {recentIssues.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No recent issues found
              </Typography>
            ) : (
              <List sx={{ width: '100%', maxHeight: 500, overflow: 'auto' }}>
                {recentIssues.map((issue) => (
                  <React.Fragment key={issue._id}>
                    <ListItem 
                      alignItems="flex-start" 
                      component={Link} 
                      to={`/issues/${issue._id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>{getStatusIcon(issue.status)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                              {issue.title}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={issue.category} 
                              icon={<CategoryIcon sx={{ fontSize: '0.75rem !important' }} />}
                              sx={{ height: 24 }}
                            />
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                              noWrap
                            >
                              {issue.location}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              Reported by {issue.reporter?.name || 'Unknown'} • {new Date(issue.createdAt).toLocaleDateString()}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;