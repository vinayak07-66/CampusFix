import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case 'resolved':
      return <CheckCircleIcon fontSize="small" />;
    case 'in progress':
      return <PendingIcon fontSize="small" />;
    case 'pending':
      return <PendingIcon fontSize="small" />;
    default:
      return <ErrorIcon fontSize="small" />;
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

// Issue categories
const categories = [
  'Electrical',
  'Plumbing',
  'Structural',
  'Furniture',
  'HVAC',
  'Network',
  'Security',
  'Cleaning',
  'Other',
];

// Issue priorities
const priorities = ['Low', 'Medium', 'High', 'Critical'];

// Issue statuses
const statuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const IssuesList = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priority: '',
    status: '',
    showOnlyMine: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    
    checkUser();
    fetchIssues();
  }, [page, filters]);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate pagination
      const limit = 9;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Start building the query
      let query = supabase
        .from('issues')
        .select('*, profiles!inner(*)', { count: 'exact' });
      
      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Filter by user if "My Issues" is selected
      if (filters.showOnlyMine && user) {
        query = query.eq('user_id', user.id);
      }
      
      // Get count first for pagination
      const { count } = await query.count();
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / limit));
      
      // Execute the query with pagination
      const { data, error: supabaseError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (supabaseError) throw supabaseError;
      
      // Transform data to match the expected format
      const formattedIssues = data.map(issue => ({
        _id: issue.id,
        title: issue.title,
        description: issue.description,
        location: issue.location,
        status: issue.status,
        priority: issue.priority,
        category: issue.category,
        media: issue.image_url ? [issue.image_url] : [],
        createdAt: issue.created_at,
        user: {
          email: issue.profiles.email,
          name: issue.profiles.full_name
        }
      }));
      
      setIssues(formattedIssues);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues. Please try again later.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPage(1);
  };

  const handleToggleMyIssues = () => {
    setFilters(prev => ({
      ...prev,
      showOnlyMine: !prev.showOnlyMine,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      priority: '',
      status: '',
      showOnlyMine: false,
    });
    setPage(1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (loading && page === 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Campus Issues
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/issues/new"
          startIcon={<AddIcon />}
        >
          Report Issue
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="search"
                label="Search Issues"
                value={filters.search}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleFilterChange({ target: { name: 'search', value: '' } })}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={toggleFilters}
                startIcon={<FilterListIcon />}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant={filters.showOnlyMine ? 'contained' : 'outlined'}
                color={filters.showOnlyMine ? 'primary' : 'inherit'}
                onClick={handleToggleMyIssues}
              >
                {filters.showOnlyMine ? 'My Issues' : 'All Issues'}
              </Button>
            </Grid>
            
            {showFilters && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={filters.category}
                      label="Category"
                      onChange={handleFilterChange}
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
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      id="priority"
                      name="priority"
                      value={filters.priority}
                      label="Priority"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      {priorities.map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {priority}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={filters.status}
                      label="Status"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="text"
                      color="inherit"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                      disabled={!filters.category && !filters.priority && !filters.status && !filters.search && !filters.showOnlyMine}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Issues Grid */}
      {issues.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {issues.map((issue) => (
              <Grid item xs={12} sm={6} md={4} key={issue._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardActionArea component={Link} to={`/issues/${issue._id}`}>
                    {issue.media && issue.media.length > 0 && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={issue.media[0]}
                        alt={issue.title}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h2" noWrap>
                          {issue.title}
                        </Typography>
                        <Tooltip title={issue.status}>
                          <Chip
                            icon={getStatusIcon(issue.status)}
                            label={issue.status}
                            size="small"
                            color={getStatusColor(issue.status)}
                          />
                        </Tooltip>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {issue.location}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 2,
                      }}>
                        {issue.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={issue.category} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={issue.priority} 
                          size="small" 
                          color={issue.priority === 'Critical' ? 'error' : 
                                issue.priority === 'High' ? 'warning' : 
                                issue.priority === 'Medium' ? 'info' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                showFirstButton 
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No issues found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {filters.search || filters.category || filters.priority || filters.status || filters.showOnlyMine
              ? 'Try adjusting your filters to see more results.'
              : 'There are no reported issues yet.'}
          </Typography>
          {(filters.search || filters.category || filters.priority || filters.status || filters.showOnlyMine) && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default IssuesList;