import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Card,
  CardMedia,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
} from '@mui/icons-material';

// Issue categories
const categories = [
  'Electrical',
  'Plumbing',
  'Structural',
  'Furniture',
  'Network',
  'Security',
  'Cleaning',
  'Other',
];

// Issue priorities
const priorities = ['Low', 'Medium', 'High', 'Critical'];

const IssueForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    };
    
    checkUser();
  }, [navigate]);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      location: '',
      category: '',
      priority: 'Medium',
    },
    validationSchema: Yup.object({
      title: Yup.string()
        .required('Title is required')
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title must be less than 100 characters'),
      description: Yup.string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters'),
      location: Yup.string()
        .required('Location is required')
        .max(100, 'Location must be less than 100 characters'),
      category: Yup.string()
        .required('Category is required'),
      priority: Yup.string()
        .required('Priority is required'),
    }),
    onSubmit: async (values) => {
      try {
        if (!user) {
          setError('You must be logged in to report an issue');
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // First, upload any media files
        let imageUrl = null;
        
        if (uploadedFiles.length > 0) {
          // We'll just use the first image for now
          const file = uploadedFiles[0];
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `issues/${user.id}/${fileName}`;
          
          // Upload progress simulation
          const uploadProgressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 95) {
                clearInterval(uploadProgressInterval);
                return 95;
              }
              return prev + 5;
            });
          }, 100);
          
          // Upload file to Supabase Storage
          const { error: uploadError, data } = await supabase
            .storage
            .from('media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          clearInterval(uploadProgressInterval);
          
          if (uploadError) {
            throw uploadError;
          }
          
          setUploadProgress(100);
          
          // Get public URL for the uploaded file
          const { data: { publicUrl } } = supabase
            .storage
            .from('media')
            .getPublicUrl(filePath);
            
          imageUrl = publicUrl;
        }
        
        // Build issue payload with only available fields
        const issueData = {
          title: values.title,
          description: values.description,
          status: 'Pending',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Only include optional fields if they have values
        if (values.location) {
          issueData.location = values.location;
        }
        if (values.category) {
          issueData.category = values.category;
        }
        if (values.priority) {
          issueData.priority = values.priority;
        }
        if (imageUrl) {
          issueData.image_url = imageUrl;
        }
        
        const { data, error: insertError } = await supabase
          .from('issues')
          .insert(issueData)
          .select();
          
        if (insertError) throw insertError;
        
        // Redirect to the newly created issue
        navigate(`/issues/${data[0].id}`);
      } catch (err) {
        console.error('Error creating issue:', err);
        setError(err.message || 'Failed to create issue. Please try again.');
        setLoading(false);
      }
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxFiles: 5,
    maxSize: 10485760, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const errorMessage = rejectedFiles[0].errors[0].message;
        setError(`File upload error: ${errorMessage}`);
        return;
      }
      
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    },
  });

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

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
          Report an Issue
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="title"
                name="title"
                label="Issue Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                placeholder="Brief title describing the issue"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                multiline
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                placeholder="Provide detailed information about the issue"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ ml: 1 }}>
                Location Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="building"
                    name="building"
                    label="Building Name"
                    value={formik.values.building || ''}
                    onChange={(e) => {
                      formik.setFieldValue('building', e.target.value);
                      // Update the combined location field
                      const room = formik.values.room || '';
                      const area = formik.values.area || '';
                      formik.setFieldValue('location', `${e.target.value}${room ? `, Room ${room}` : ''}${area ? `, ${area}` : ''}`);
                    }}
                    placeholder="Enter building name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="room"
                    name="room"
                    label="Room Number"
                    value={formik.values.room || ''}
                    onChange={(e) => {
                      formik.setFieldValue('room', e.target.value);
                      // Update the combined location field
                      const building = formik.values.building || '';
                      const area = formik.values.area || '';
                      formik.setFieldValue('location', `${building}${e.target.value ? `, Room ${e.target.value}` : ''}${area ? `, ${area}` : ''}`);
                    }}
                    placeholder="Enter room number"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="area"
                    name="area"
                    label="Specific Area (Optional)"
                    value={formik.values.area || ''}
                    onChange={(e) => {
                      formik.setFieldValue('area', e.target.value);
                      // Update the combined location field
                      const building = formik.values.building || '';
                      const room = formik.values.room || '';
                      formik.setFieldValue('location', `${building}${room ? `, Room ${room}` : ''}${e.target.value ? `, ${e.target.value}` : ''}`);
                    }}
                    placeholder="Describe specific area if needed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="location"
                    name="location"
                    label="Complete Location"
                    value={formik.values.location}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.location && Boolean(formik.errors.location)}
                    helperText={formik.touched.location && formik.errors.location}
                    placeholder="Building name, room number, or specific area"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth
                error={formik.touched.category && Boolean(formik.errors.category)}
              >
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formik.values.category}
                  label="Category"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.category && formik.errors.category && (
                  <FormHelperText>{formik.errors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth
                error={formik.touched.priority && Boolean(formik.errors.priority)}
              >
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={formik.values.priority}
                  label="Priority"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.priority && formik.errors.priority && (
                  <FormHelperText>{formik.errors.priority}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Attach Media Evidence
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload images or videos to help describe the issue (max 5 files, 10MB each)
              </Typography>
              
              <Paper elevation={0} sx={{ 
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                mb: 3,
                bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
              }}>
                <Box
                  {...getRootProps()}
                  sx={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    py: 2,
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body1" gutterBottom fontWeight={500}>
                    {isDragActive
                      ? 'Drop the files here...'
                      : 'Drag & drop files here, or click to select files'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPEG, PNG, GIF, MP4, MOV, AVI
                  </Typography>
                </Box>
              </Paper>
              
              {uploadedFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ ml: 1, mb: 2 }}>
                    Uploaded Files ({uploadedFiles.length}/5)
                  </Typography>
                  <Grid container spacing={2}>
                    {uploadedFiles.map((file, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Card sx={{ 
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          }
                        }}>
                          {file.type.startsWith('image/') ? (
                            <CardMedia
                              component="img"
                              height="140"
                              image={URL.createObjectURL(file)}
                              alt={`Preview ${index}`}
                              sx={{ objectFit: 'cover' }}
                            />
                          ) : file.type.startsWith('video/') ? (
                            <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.03)' }}>
                              <Typography variant="body2" color="text.secondary" align="center">
                                Video File
                                <br />
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.03)' }}>
                              <Typography variant="body2" color="text.secondary" align="center">
                                File
                                <br />
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </Typography>
                            </Box>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 1)',
                              },
                            }}
                            onClick={() => handleRemoveFile(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <Box sx={{ p: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {file.type.split('/')[0]} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  component={Link}
                  to="/issues"
                  color="inherit"
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                >
                  {loading ? 'Submitting...' : 'Submit Issue'}
                </Button>
              </Box>
              
              {loading && uploadedFiles.length > 0 && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Uploading files: {uploadProgress}%
                  </Typography>
                  <Box
                    sx={{
                      height: 4,
                      width: '100%',
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${uploadProgress}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        transition: 'width 0.3s',
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default IssueForm;