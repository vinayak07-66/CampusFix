import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  HourglassEmpty as InProgressIcon,
  Flag as FlagIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

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
const statuses = ['Pending', 'In Progress', 'Resolved'];

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending':
      return <PendingIcon />;
    case 'In Progress':
      return <InProgressIcon />;
    case 'Resolved':
      return <CheckCircleIcon />;
    default:
      return null;
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'In Progress':
      return 'info';
    case 'Resolved':
      return 'success';
    default:
      return 'default';
  }
};

// Helper function to get priority color
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Low':
      return 'success';
    case 'Medium':
      return 'info';
    case 'High':
      return 'warning';
    case 'Critical':
      return 'error';
    default:
      return 'default';
  }
};

const IssueManagement = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalIssues, setTotalIssues] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [issueStats, setIssueStats] = useState(null);
  const [user, setUser] = useState(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;
      
      // Start building the query
      let query = supabase
        .from('issues')
        .select('*, profiles(*)', { count: 'exact' });
      
      // Apply filters
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
      }
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      
      if (priorityFilter) {
        query = query.eq('priority', priorityFilter);
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      // Get count first for pagination
      const { count } = await query.count();
      setTotalIssues(count || 0);
      
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
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        reporter: {
          _id: issue.profiles.id,
          name: issue.profiles.full_name,
          email: issue.profiles.email
        }
      }));
      
      setIssues(formattedIssues);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueStats = async () => {
    try {
      setStatsLoading(true);
      
      // Get total issues count
      const { count: totalCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .count();
      
      // Get open issues count (Pending and In Progress)
      const { count: openCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .or('status.eq.Pending,status.eq.In Progress')
        .count();
      
      // Get resolved issues count
      const { count: resolvedCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .eq('status', 'Resolved')
        .count();
      
      // Calculate resolution rate
      const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
      
      // For average resolution time, we would need more complex queries
      // This is a simplified version
      const avgResolutionTime = '3.5 days'; // Placeholder
      
      setIssueStats({
        totalIssues: totalCount || 0,
        openIssues: openCount || 0,
        resolutionRate,
        avgResolutionTime
      });
    } catch (err) {
      console.error('Error fetching issue statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Get user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          // Check if user is admin
          if (profileData.role !== 'admin') {
            // Redirect non-admin users
            navigate('/dashboard');
            return;
          }
          
          setUser(prev => ({ ...prev, ...profileData }));
        }
        
        fetchIssues();
        fetchIssueStats();
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    };
    
    checkUser();
  }, [navigate]);
  
  useEffect(() => {
    if (user) {
      fetchIssues();
    }
  }, [page, rowsPerPage, search, categoryFilter, priorityFilter, statusFilter]);

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

  const handlePriorityFilterChange = (e) => {
    setPriorityFilter(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setPriorityFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const handleEditClick = (issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setNewPriority(issue.priority);
    setEditDialogOpen(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleDeleteClick = (issue) => {
    setSelectedIssue(issue);
    setDeleteDialogOpen(true);
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handlePriorityChange = (e) => {
    setNewPriority(e.target.value);
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue || (newStatus === selectedIssue.status && newPriority === selectedIssue.priority)) {
      setEditDialogOpen(false);
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError(null);
      setUpdateSuccess(false);

      // Update issue in Supabase
      const { error: updateError } = await supabase
        .from('issues')
        .update({
          status: newStatus,
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedIssue._id);
      
      if (updateError) throw updateError;
      
      // Update the issue in the local state
      setIssues(issues.map(issue => 
        issue._id === selectedIssue._id 
          ? { ...issue, status: newStatus, priority: newPriority } 
          : issue
      ));
      
      setUpdateSuccess(true);
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setEditDialogOpen(false);
        fetchIssueStats(); // Refresh stats after update
      }, 1500);
    } catch (err) {
      console.error('Error updating issue:', err);
      setUpdateError(err.message || 'Failed to update issue. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteIssue = async () => {
    try {
      setDeleteLoading(true);

      // First delete any comments associated with this issue
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('issue_id', selectedIssue._id);
      
      if (commentsError) throw commentsError;
      
      // Then delete the issue itself
      const { error: deleteError } = await supabase
        .from('issues')
        .delete()
        .eq('id', selectedIssue._id);
      
      if (deleteError) throw deleteError;
      
      // Remove the issue from the local state
      setIssues(issues.filter(issue => issue._id !== selectedIssue._id));
      setTotalIssues(prev => prev - 1);
      
      setDeleteDialogOpen(false);
      fetchIssueStats(); // Refresh stats after delete
    } catch (err) {
      console.error('Error deleting issue:', err);
      setError('Failed to delete issue. Please try again.');
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Issue Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Issue Statistics */}
      {!statsLoading && issueStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Average Resolution Time</Typography>
                <Typography variant="h4" color="primary">{issueStats.avgResolutionTime}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Resolution Rate</Typography>
                <Typography variant="h4" color="success.main">{issueStats.resolutionRate}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Open Issues</Typography>
                <Typography variant="h4" color="warning.main">{issueStats.openIssues}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Issues</Typography>
                <Typography variant="h4">{issueStats.totalIssues}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search Issues"
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
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                value={priorityFilter}
                label="Priority"
                onChange={handlePriorityFilterChange}
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
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
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
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                disabled={!search && !categoryFilter && !priorityFilter && !statusFilter}
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Issues Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reporter</TableCell>
                <TableCell>Reported On</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No issues found
                    </Typography>
                    {(search || categoryFilter || priorityFilter || statusFilter) && (
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
                issues.map((issue) => (
                  <TableRow key={issue._id} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {issue.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {issue.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={issue.category} 
                        icon={<CategoryIcon />}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={issue.priority} 
                        color={getPriorityColor(issue.priority)}
                        icon={<FlagIcon />}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={issue.status} 
                        color={getStatusColor(issue.status)}
                        icon={getStatusIcon(issue.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {issue.reporter?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            component={Link}
                            to={`/issues/${issue._id}`}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Status/Priority">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleEditClick(issue)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Issue">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteClick(issue)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalIssues}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Edit Issue Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Update Issue</DialogTitle>
        <DialogContent>
          {selectedIssue && (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Update status and priority for issue: <strong>{selectedIssue.title}</strong>
              </DialogContentText>
              
              {updateError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {updateError}
                </Alert>
              )}
              
              {updateSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Issue updated successfully!
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      value={newStatus}
                      label="Status"
                      onChange={handleStatusChange}
                    >
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(status)}
                            <Typography sx={{ ml: 1 }}>{status}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      value={newPriority}
                      label="Priority"
                      onChange={handlePriorityChange}
                    >
                      {priorities.map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FlagIcon color={getPriorityColor(priority)} />
                            <Typography sx={{ ml: 1 }}>{priority}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateIssue} 
            color="primary" 
            variant="contained"
            disabled={updateLoading || !selectedIssue || (newStatus === selectedIssue?.status && newPriority === selectedIssue?.priority)}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Update Issue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Issue Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Issue</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this issue? This action cannot be undone.
          </DialogContentText>
          {selectedIssue && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1">{selectedIssue.title}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary">
                <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {selectedIssue.location}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <CategoryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {selectedIssue.category}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteIssue} 
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

export default IssueManagement;