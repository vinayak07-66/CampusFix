import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case 'resolved':
      return <CheckCircleIcon />;
    case 'in progress':
      return <PendingIcon />;
    case 'pending':
      return <PendingIcon />;
    default:
      return <ErrorIcon />;
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

// Issue priorities
const priorities = ['Low', 'Medium', 'High', 'Critical'];

// Issue statuses
const statuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    priority: '',
    resolution: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        
        // Get user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setCurrentUser(prev => ({ ...prev, ...profileData }));
        }
      }
    };
    
    checkUser();
    fetchIssue();
    fetchComments();
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      
      // Fetch issue with user profile data
      const { data, error: supabaseError } = await supabase
        .from('issues')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (supabaseError) throw supabaseError;
      
      if (data) {
        // Transform data to match the expected format
        const formattedIssue = {
          _id: data.id,
          title: data.title,
          description: data.description,
          location: data.location,
          status: data.status,
          priority: data.priority,
          category: data.category,
          media: data.image_url ? [data.image_url] : [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          resolution: data.resolution,
          reporter: {
            _id: data.profiles.id,
            name: data.profiles.full_name,
            email: data.profiles.email,
            role: data.profiles.role
          }
        };
        
        setIssue(formattedIssue);
        
        // Initialize update form with current values
        setUpdateData({
          status: data.status,
          priority: data.priority,
          resolution: data.resolution || '',
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching issue:', err);
      setError('Failed to load issue details. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchComments = async () => {
    try {
      const { data, error: commentsError } = await supabase
        .from('issue_comments')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('issue_id', id)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;
      
      if (data) {
        // Transform data to match the expected format
        const formattedComments = data.map(comment => ({
          _id: comment.id,
          text: comment.text,
          createdAt: comment.created_at,
          user: {
            _id: comment.profiles.id,
            name: comment.profiles.full_name,
            email: comment.profiles.email,
            role: comment.profiles.role,
            profileImage: comment.profiles.avatar_url
          }
        }));
        
        setComments(formattedComments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;
    
    try {
      setCommentLoading(true);
      
      // Add comment to Supabase
      const { error: commentError } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: id,
          user_id: currentUser.id,
          text: comment,
          created_at: new Date().toISOString()
        });
      
      if (commentError) throw commentError;
      
      setComment('');
      fetchComments(); // Refresh to get the new comment
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteIssue = async () => {
    try {
      setLoading(true);
      
      // First delete all comments related to this issue
      const { error: commentsDeleteError } = await supabase
        .from('issue_comments')
        .delete()
        .eq('issue_id', id);
      
      if (commentsDeleteError) throw commentsDeleteError;
      
      // Then delete the issue itself
      const { error: issueDeleteError } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);
      
      if (issueDeleteError) throw issueDeleteError;
      
      navigate('/issues');
    } catch (err) {
      console.error('Error deleting issue:', err);
      setError('Failed to delete issue. Please try again.');
      setLoading(false);
      handleDeleteDialogClose();
    }
  };

  const handleUpdateDialogOpen = () => {
    setUpdateDialogOpen(true);
  };

  const handleUpdateDialogClose = () => {
    setUpdateDialogOpen(false);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateIssue = async () => {
    try {
      setUpdateLoading(true);
      
      // Update issue in Supabase
      const { error: updateError } = await supabase
        .from('issues')
        .update({
          status: updateData.status,
          priority: updateData.priority,
          resolution: updateData.resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      handleUpdateDialogClose();
      fetchIssue(); // Refresh to get updated data
    } catch (err) {
      console.error('Error updating issue:', err);
      setError('Failed to update issue. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const handleImageDialogClose = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
  };

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

  if (!issue) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Issue not found. It may have been deleted or you don't have permission to view it.
      </Alert>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';
  const isReporter = issue?.reporter?._id === currentUser?.id;
  const canUpdate = isAdmin || isStaff;
  const canDelete = isAdmin || isReporter;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/issues"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Issues
        </Button>
        <Typography variant="h4" component="h1">
          Issue Details
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {issue.title}
                </Typography>
                <Chip
                  icon={getStatusIcon(issue.status)}
                  label={issue.status}
                  color={getStatusColor(issue.status)}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                {issue.description}
              </Typography>
              
              {issue.resolution && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Resolution:
                  </Typography>
                  <Typography variant="body1">
                    {issue.resolution}
                  </Typography>
                </Box>
              )}
              
              {/* Media Gallery */}
              {issue.media && issue.media.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <ImageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Attached Media
                  </Typography>
                  <ImageList cols={3} gap={8}>
                    {issue.media.map((item, index) => (
                      <ImageListItem 
                        key={index} 
                        onClick={() => handleImageClick(item)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 },
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={item}
                          alt={`Issue media ${index + 1}`}
                          loading="lazy"
                          style={{ height: 120, objectFit: 'cover' }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Comments
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {comments && comments.length > 0 ? (
                <List>
                  {comments.map((comment) => (
                    <React.Fragment key={comment._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar 
                            alt={comment.user?.name || 'User'} 
                            src={comment.user?.profileImage}
                          >
                            {comment.user?.name?.charAt(0) || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" component="span">
                                {comment.user?.name || 'Unknown User'}
                                {comment.user?.role && (
                                  <Chip 
                                    label={comment.user.role} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    sx={{ ml: 1, textTransform: 'capitalize' }}
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ mt: 1 }}
                            >
                              {comment.text}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No comments yet. Be the first to comment!
                </Typography>
              )}
              
              {/* Add Comment Form */}
              <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Add a comment"
                  multiline
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type your comment here..."
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    endIcon={commentLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    disabled={!comment.trim() || commentLoading}
                  >
                    {commentLoading ? 'Sending...' : 'Add Comment'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Issue Details Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Issue Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <LocationIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Location" secondary={issue.location} />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <CategoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Category" secondary={issue.category} />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: issue.priority === 'Critical' ? 'error.main' : 
                                        issue.priority === 'High' ? 'warning.main' : 
                                        issue.priority === 'Medium' ? 'info.main' : 'success.main' }}>
                      <FlagIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Priority" secondary={issue.priority} />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Reported By" 
                    secondary={issue.reporter?.name || 'Unknown User'} 
                  />
                </ListItem>
                
                {issue.assignee && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Assigned To" 
                      secondary={issue.assignee.name} 
                    />
                  </ListItem>
                )}
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar>
                      <CalendarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Reported On" 
                    secondary={new Date(issue.createdAt).toLocaleDateString()} 
                  />
                </ListItem>
                
                {issue.updatedAt && issue.updatedAt !== issue.createdAt && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar>
                        <CalendarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={new Date(issue.updatedAt).toLocaleDateString()} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {canUpdate && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={handleUpdateDialogOpen}
                  >
                    Update Issue
                  </Button>
                )}
                
                {canDelete && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteDialogOpen}
                  >
                    Delete Issue
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Issue</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this issue? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteIssue} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Issue Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={handleUpdateDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Issue</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={updateData.status}
                  label="Status"
                  onChange={handleUpdateChange}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={updateData.priority}
                  label="Priority"
                  onChange={handleUpdateChange}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resolution Details"
                name="resolution"
                multiline
                rows={4}
                value={updateData.resolution}
                onChange={handleUpdateChange}
                placeholder="Provide details about how the issue was resolved"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateDialogClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateIssue} 
            color="primary" 
            variant="contained"
            disabled={updateLoading}
          >
            {updateLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleImageDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 1 }}>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Issue media"
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImageDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IssueDetail;