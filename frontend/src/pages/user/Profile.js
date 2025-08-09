import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from 'axios';

import {
  // Only keep the components we're actually using
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  // Only keep the icons we're actually using
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// List of departments for dropdown
const departments = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Sociology',
  'English',
  'History',
  'Philosophy',
  'Political Science',
  'Other',
];

const Profile = () => {
  const { user, updateProfile, changePassword, setError: setAuthError } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userIssues, setUserIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  useEffect(() => {
    // Clear any previous errors or success messages
    setError(null);
    setSuccess(null);
    setAuthError(null);
    
    // Fetch user's reported issues
    fetchUserIssues();
  }, [setAuthError, user]); // Add user to dependency array since fetchUserIssues depends on user
  
  // Fetch user's reported issues
  const fetchUserIssues = async () => {
    if (!user) return;
    
    try {
      setIssuesLoading(true);
      
      // Fetch issues reported by the user from Supabase
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUserIssues(data || []);
    } catch (err) {
      console.error('Error fetching user issues:', err);
      setError('Failed to load your reported issues.');
    } finally {
      setIssuesLoading(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // Reset form when entering edit mode
      profileFormik.resetForm({
        values: {
          name: user?.name || '',
          email: user?.email || '',
          studentId: user?.studentId || '',
          department: user?.department || '',
        },
      });
      setImagePreview(null);
      setProfileImage(null);
    }
  };

  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
    passwordFormik.resetForm();
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile update form
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      studentId: user?.studentId || '',
      department: user?.department || '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      studentId: Yup.string()
        .required('Student ID is required'),
      department: Yup.string()
        .required('Department is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        // If there's a new profile image, upload it first
        let profileImageUrl = user?.profileImage;
        
        if (profileImage) {
          const formData = new FormData();
          formData.append('file', profileImage);
          
          const uploadResponse = await axios.post('/api/uploads/single', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          profileImageUrl = uploadResponse.data.fileUrl;
        }
        
        // Update profile with image URL if uploaded
        await updateProfile({
          name: values.name,
          department: values.department,
          profileImage: profileImageUrl,
        });
        
        setSuccess('Profile updated successfully');
        setEditMode(false);
      } catch (err) {
        console.error('Error updating profile:', err);
        setError(err.response?.data?.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    },
  });

  // Password change form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string()
        .required('Current password is required'),
      newPassword: Yup.string()
        .required('New password is required')
        .min(6, 'Password must be at least 6 characters'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        await changePassword(values.currentPassword, values.newPassword);
        setSuccess('Password changed successfully');
        handlePasswordDialogClose();
      } catch (err) {
        console.error('Error changing password:', err);
        setError(err.response?.data?.message || 'Failed to change password');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            {/* Profile Picture Card */}
            <div className="bg-white shadow-md rounded-2xl p-6 mb-6 text-center transition duration-300 hover:shadow-lg">
              <div className="flex justify-center mb-4">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user?.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-4xl text-indigo-500 font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.name || 'User'}</h2>
              <p className="text-gray-500 mb-2">{user?.email}</p>
              <div className="inline-block bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full capitalize">
                {user?.role || 'Student'}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Account Security</h3>
                <button
                  onClick={handlePasswordDialogOpen}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-300 transform hover:scale-105"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {/* Profile Information Card */}
            <div className="bg-white shadow-md rounded-2xl p-6 mb-6 transition duration-300 hover:shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
                <button
                  className={`flex items-center gap-2 py-2 px-4 rounded-lg transition duration-300 ${editMode 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  onClick={handleEditToggle}
                  disabled={loading}
                >
                  {editMode ? (
                    <>
                      <CancelIcon fontSize="small" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <EditIcon fontSize="small" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="border-b border-gray-200 mb-6"></div>
              
              {editMode ? (
                <form onSubmit={profileFormik.handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={profileFormik.values.name}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`w-full px-4 py-2 rounded-lg border ${profileFormik.touched.name && profileFormik.errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
                      />
                      {profileFormik.touched.name && profileFormik.errors.name && (
                        <p className="mt-1 text-sm text-red-600">{profileFormik.errors.name}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileFormik.values.email}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID
                      </label>
                      <input
                        id="studentId"
                        name="studentId"
                        type="text"
                        value={profileFormik.values.studentId}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">Student ID cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={profileFormik.values.department}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`w-full px-4 py-2 rounded-lg border ${profileFormik.touched.department && profileFormik.errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
                      >
                        {departments.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {profileFormik.touched.department && profileFormik.errors.department && (
                        <p className="mt-1 text-sm text-red-600">{profileFormik.errors.department}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center">
                        <label className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-100 transition duration-300">
                          <PhotoCameraIcon className="mr-2" fontSize="small" />
                          <span>Upload Profile Picture</span>
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="mt-4 flex items-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                            <img
                              src={imagePreview}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm text-gray-600">
                            New profile picture preview
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} color="inherit" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <SaveIcon fontSize="small" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-base text-gray-900">{user?.name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email Address</h3>
                    <p className="text-base text-gray-900">{user?.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Student ID</h3>
                    <p className="text-base text-gray-900">{user?.studentId || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                    <p className="text-base text-gray-900">{user?.department || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                    <p className="text-base text-gray-900 capitalize">{user?.role || 'Student'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Account Created</h3>
                    <p className="text-base text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* User's Reported Issues */}
            <div className="bg-white shadow-md rounded-2xl p-6 transition duration-300 hover:shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  My Reported Issues
                </h2>
                <Link 
                  to="/issues/create" 
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition duration-300"
                >
                  <span>Report New Issue</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="border-b border-gray-200 mb-6"></div>
              
              {issuesLoading ? (
                <div className="flex justify-center py-8">
                  <CircularProgress />
                </div>
              ) : userIssues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userIssues.map((issue) => (
                    <div 
                      key={issue.id} 
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 transform hover:scale-105"
                    >
                      {issue.image_url && (
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={issue.image_url} 
                            alt={issue.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{issue.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${issue.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : issue.status === 'in progress' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'}`}>
                            {issue.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{issue.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                          <Link 
                            to={`/issues/${issue.id}`} 
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">You haven't reported any issues yet.</p>
                  <Link 
                    to="/issues/create" 
                    className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    Report Your First Issue
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose}>
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              To change your password, please enter your current password and then your new password.
            </DialogContentText>
            
            <TextField
              fullWidth
              margin="dense"
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              margin="dense"
              id="newPassword"
              name="newPassword"
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              margin="dense"
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePasswordDialogClose} color="inherit">
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Profile;