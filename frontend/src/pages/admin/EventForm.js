import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
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
  Save as SaveIcon,
} from '@mui/icons-material';

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

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(id ? true : false);
  const [error, setError] = useState(null);
  const [eventImage, setEventImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isEditMode = Boolean(id);

  const validationSchema = Yup.object({
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
    startDate: Yup.date()
      .required('Start date is required')
      .min(new Date(), 'Start date cannot be in the past'),
    endDate: Yup.date()
      .required('End date is required')
      .min(
        Yup.ref('startDate'),
        'End date must be after start date'
      ),
    registrationDeadline: Yup.date()
      .required('Registration deadline is required')
      .max(
        Yup.ref('startDate'),
        'Registration deadline must be before start date'
      ),
    capacity: Yup.number()
      .nullable()
      .transform((value, originalValue) => originalValue.trim() === '' ? null : value)
      .min(1, 'Capacity must be at least 1')
      .integer('Capacity must be a whole number'),
    additionalInfo: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      location: '',
      category: '',
      startDate: new Date(new Date().setHours(new Date().getHours() + 1)),
      endDate: new Date(new Date().setHours(new Date().getHours() + 3)),
      registrationDeadline: new Date(),
      capacity: '',
      additionalInfo: '',
    },
    validationSchema,
    onSubmit: async (values) =>  {
      try {
        setLoading(true);
        setError(null);
        
        // First, upload image if there is one
        let imageUrl = values.image;
        
        if (eventImage) {
          const formData = new FormData();
          formData.append('file', eventImage);
          
          const uploadResponse = await axios.post('/api/uploads/single', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            },
          });
          
          imageUrl = uploadResponse.data.fileUrl;
        }
        
        // Prepare event data
        const eventData = {
          ...values,
          image: imageUrl,
          capacity: values.capacity || null,
        };
        
        // Create or update event
        if (isEditMode) {
          await axios.put(`/api/events/${id}`, eventData);
        } else {
          await axios.post('/api/events', eventData);
        }
        
        // Redirect to events list
        navigate('/admin/events');
      } catch (err) {
        console.error('Error saving event:', err);
        setError(err.response?.data?.message || 'Failed to save event. Please try again.');
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          setInitialLoading(true);
          const response = await axios.get(`/api/events/${id}`);
          const event = response.data;
          
          formik.setValues({
            title: event.title || '',
            description: event.description || '',
            location: event.location || '',
            category: event.category || '',
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            registrationDeadline: new Date(event.registrationDeadline),
            capacity: event.capacity?.toString() || '',
            additionalInfo: event.additionalInfo || '',
            image: event.image || '',
          });
          
          setEventImage(null);
        } catch (err) {
          console.error('Error fetching event:', err);
          setError('Failed to load event details. Please try again.');
        } finally {
          setInitialLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [id, isEditMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const errorMessage = rejectedFiles[0].errors[0].message;
        setError(`Image upload error: ${errorMessage}`);
        return;
      }
      
      setEventImage(acceptedFiles[0]);
    },
  });

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/admin/events"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Events
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
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
                label="Event Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                placeholder="Enter a descriptive title for the event"
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
                placeholder="Provide detailed information about the event"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="location"
                name="location"
                label="Location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={formik.touched.location && formik.errors.location}
                placeholder="Building name, room number, or specific area"
              />
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
              <TextField
                fullWidth
                id="capacity"
                name="capacity"
                label="Capacity (Optional)"
                type="number"
                value={formik.values.capacity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.capacity && Boolean(formik.errors.capacity)}
                helperText={
                  (formik.touched.capacity && formik.errors.capacity) ||
                  "Leave empty for unlimited capacity"
                }
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={formik.values.startDate}
                      onChange={(value) => formik.setFieldValue('startDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.startDate && Boolean(formik.errors.startDate),
                          helperText: formik.touched.startDate && formik.errors.startDate,
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={formik.values.endDate}
                      onChange={(value) => formik.setFieldValue('endDate', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.endDate && Boolean(formik.errors.endDate),
                          helperText: formik.touched.endDate && formik.errors.endDate,
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <DateTimePicker
                      label="Registration Deadline"
                      value={formik.values.registrationDeadline}
                      onChange={(value) => formik.setFieldValue('registrationDeadline', value)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: formik.touched.registrationDeadline && Boolean(formik.errors.registrationDeadline),
                          helperText: formik.touched.registrationDeadline && formik.errors.registrationDeadline,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="additionalInfo"
                name="additionalInfo"
                label="Additional Information (Optional)"
                multiline
                rows={3}
                value={formik.values.additionalInfo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.additionalInfo && Boolean(formik.errors.additionalInfo)}
                helperText={formik.touched.additionalInfo && formik.errors.additionalInfo}
                placeholder="Any additional details participants should know"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                Event Image
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload an image for the event (recommended size: 1200x600px)
              </Typography>
              
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 2,
                  bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  {isDragActive
                    ? 'Drop the image here...'
                    : 'Drag & drop an image here, or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: JPEG, PNG, GIF (max 5MB)
                </Typography>
              </Box>
              
              {(eventImage || formik.values.image) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Event Image Preview
                  </Typography>
                  <Card sx={{ maxWidth: 300, position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="150"
                      image={eventImage ? URL.createObjectURL(eventImage) : formik.values.image}
                      alt="Event preview"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                        },
                      }}
                      onClick={() => {
                        setEventImage(null);
                        formik.setFieldValue('image', '');
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Card>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  component={Link}
                  to="/admin/events"
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
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {loading ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
                </Button>
              </Box>
              
              {loading && eventImage && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Uploading image: {uploadProgress}%
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

export default EventForm;