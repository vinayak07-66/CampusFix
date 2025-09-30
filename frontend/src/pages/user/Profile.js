import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from 'axios';

import {
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
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
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
  const [userReports, setUserReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    // Clear any previous errors or success messages
    setError(null);
    setSuccess(null);
    setAuthError(null);
    
    // Fetch user's reported issues and reports
    fetchUserIssues();
    fetchUserReports();
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

  // Fetch user's submitted reports
  const fetchUserReports = async () => {
    if (!user) return;
    
    try {
      setReportsLoading(true);
      
      // First try to fetch from Supabase
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      
      let reports = data || [];
      
      // Also check local storage for demo reports
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        const userLocalReports = localReports.filter(report => report.student_id === user.id);
        reports = [...userLocalReports, ...reports];
      } catch (err) {
        console.error('Error parsing local reports:', err);
      }
      
      setUserReports(reports);
    } catch (err) {
      console.error('Error fetching user reports:', err);
      // Fallback to local storage only
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        const userLocalReports = localReports.filter(report => report.student_id === user.id);
        setUserReports(userLocalReports);
      } catch (localErr) {
        console.error('Error parsing local reports:', localErr);
        setUserReports([]);
      }
    } finally {
      setReportsLoading(false);
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
        // If there's a new profile image, upload it to Supabase Storage first
        let profileImageUrl = user?.profileImage;
        
        if (profileImage) {
          try {
            const fileExt = profileImage.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('profiles')
              .upload(`images/${fileName}`, profileImage, { upsert: false });
            
            if (uploadError) {
              console.error('Error uploading profile image:', uploadError);
              setError('Image upload failed, but profile will be updated');
            } else {
              const { data: publicUrl } = supabase.storage
                .from('profiles')
                .getPublicUrl(`images/${fileName}`);
              profileImageUrl = publicUrl.publicUrl;
            }
          } catch (uploadErr) {
            console.error('Unexpected upload error:', uploadErr);
            setError('Image upload failed, but profile will be updated');
          }
        }
        
        // Update profile with image URL if uploaded
        await updateProfile({
          name: values.name,
          department: values.department,
          profileImage: profileImageUrl,
        });
        
        setSuccess('Profile updated successfully');
        setEditMode(false);
        
        // Refresh local user state without full reload
        await new Promise(resolve => setTimeout(resolve, 800));
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 animate-fadeIn">My Profile</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm animate-fadeIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg shadow-sm animate-fadeIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            {/* Profile Picture Card */}
            <div className="bg-white shadow-lg rounded-2xl p-6 mb-6 text-center transition-all duration-300 hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-purple-700"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-4 mt-8">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user?.name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md transform transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold shadow-md border-4 border-white transform transition-transform duration-300 hover:scale-105">
                      {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.name || 'User'}</h2>
                <p className="text-gray-500 mb-2">{user?.email}</p>
                <div className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm px-4 py-1 rounded-full capitalize shadow-sm">
                  {user?.role || 'Student'}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Account Security</h3>
                  <button
                    onClick={handlePasswordDialogOpen}
                    className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition duration-300 transform hover:scale-105 shadow-md flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Change Password
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 transform transition-all duration-300 hover:shadow-xl">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-3 border-b">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  Quick Links
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <Link
                  to={`/report-issue`}
                  className="block py-3 px-4 bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-gray-700 font-medium transition-all duration-300 flex items-center transform hover:translate-x-1"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium block">Report New Issue</span>
                    <span className="text-xs text-gray-500">Submit a new campus issue</span>
                  </div>
                </Link>
                <Link
                  to={`/events`}
                  className="block py-3 px-4 bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200 rounded-lg text-gray-700 font-medium transition-all duration-300 flex items-center transform hover:translate-x-1"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium block">Browse Events</span>
                    <span className="text-xs text-gray-500">Discover campus activities</span>
                  </div>
                </Link>
                <Link
                  to={`/dashboard`}
                  className="block py-3 px-4 bg-white border border-gray-200 hover:bg-green-50 hover:border-green-200 rounded-lg text-gray-700 font-medium transition-all duration-300 flex items-center transform hover:translate-x-1"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium block">Dashboard</span>
                    <span className="text-xs text-gray-500">View your activity summary</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Profile Information Card */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {/* Profile Information Card */}
            <div className="bg-white shadow-md rounded-2xl p-6 mb-6 transition duration-300 hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100 rounded-full -ml-12 -mb-12 opacity-30"></div>
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Information
                  </h2>
                  <button
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105 shadow-sm ${editMode 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'}`}
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
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={profileFormik.values.name}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`w-full px-4 py-2.5 rounded-lg border ${profileFormik.touched.name && profileFormik.errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
                      />
                      {profileFormik.touched.name && profileFormik.errors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {profileFormik.errors.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileFormik.values.email}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Email cannot be changed
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        Student ID
                      </label>
                      <input
                        id="studentId"
                        name="studentId"
                        type="text"
                        value={profileFormik.values.studentId}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Student ID cannot be changed
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={profileFormik.values.department}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`w-full px-4 py-2.5 rounded-lg border ${profileFormik.touched.department && profileFormik.errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Profile Picture
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="shrink-0 flex justify-center">
                            {imagePreview ? (
                              <div className="relative group">
                                <img
                                  src={imagePreview}
                                  alt="Profile Preview"
                                  className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-md transition duration-300 group-hover:opacity-90"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                                    <PhotoCameraIcon className="text-white" fontSize="small" />
                                  </div>
                                </div>
                              </div>
                            ) : user?.profileImage ? (
                              <div className="relative group">
                                <img
                                  src={user.profileImage}
                                  alt="Current profile"
                                  className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-md transition duration-300 group-hover:opacity-90"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                                    <PhotoCameraIcon className="text-white" fontSize="small" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-white shadow-md">
                                <PersonIcon className="text-white" fontSize="large" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">Upload a new profile picture</p>
                            <label className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition duration-300 shadow-sm w-full sm:w-auto">
                              <PhotoCameraIcon className="mr-2" fontSize="small" />
                              <span>Choose Image</span>
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </label>
                          </div>
                        </div>
                        {imagePreview && (
                          <div className="mt-3 text-sm text-indigo-600 flex items-center">
                            <CheckCircleIcon fontSize="small" className="mr-1" />
                            New profile picture selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 py-2.5 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md"
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} color="inherit" />
                          <span>Saving Changes...</span>
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
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name
                    </h3>
                    <p className="text-base font-medium text-gray-900">{user?.name || 'Not set'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address
                    </h3>
                    <p className="text-base font-medium text-gray-900">{user?.email}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      Student ID
                    </h3>
                    <p className="text-base font-medium text-gray-900">{user?.studentId || 'Not set'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Department
                    </h3>
                    <p className="text-base font-medium text-gray-900">{user?.department || 'Not set'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Role
                    </h3>
                    <p className="text-base font-medium text-gray-900 capitalize">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {user?.role || 'Student'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Account Created
                    </h3>
                    <p className="text-base font-medium text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* User's Reported Issues */}
            <div className="bg-white shadow-md rounded-2xl p-6 transition duration-300 hover:shadow-lg mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  My Reported Issues
                </h2>
                <Link to={`/report-issue`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition duration-300">
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
                    to={`/report-issue`} 
                    className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    Report Your First Issue
                  </Link>
                </div>
              )}
            </div>
            
            {/* User's Submitted Reports */}
            <div className="bg-white shadow-md rounded-2xl p-6 transition duration-300 hover:shadow-lg mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  My Submitted Reports
                </h2>
                <Link to={`/reports/create`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition duration-300">
                   <span>Submit New Report</span>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                 </Link>
              </div>
              
              <div className="border-b border-gray-200 mb-6"></div>
              
              {reportsLoading ? (
                <div className="flex justify-center py-8">
                  <CircularProgress />
                </div>
              ) : userReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userReports.map((report) => (
                    <div 
                      key={report.id} 
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 transform hover:scale-105"
                    >
                      {report.photo_url && (
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={report.photo_url} 
                            alt={report.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{report.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.status === 'Pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : report.status === 'In Progress' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{report.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {report.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.priority === 'Critical' 
                              ? 'bg-red-100 text-red-800' 
                              : report.priority === 'High' 
                              ? 'bg-orange-100 text-orange-800' 
                              : report.priority === 'Medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {report.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <Link 
                            to={`/reports`} 
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
                  <p className="text-gray-500">You haven't submitted any reports yet.</p>
                  <Link 
                    to={`/reports/create`} 
                    className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    Submit Your First Report
                  </Link>
                </div>
              )}
            </div>
            
            {/* User's Registered Events */}
            <div className="bg-white shadow-md rounded-2xl p-6 transition duration-300 hover:shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  My Events
                </h2>
                <Link 
                  to={`/events`} 
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition duration-300"
                >
                  <span>Browse Events</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="border-b border-gray-200 mb-6"></div>
              
              <div className="text-center py-8">
                <p className="text-gray-500">Your registered events will appear here.</p>
                <Link 
                  to={`/events`} 
                  className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  Browse Available Events
                </Link>
              </div>
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
  </div>
  );
};
export default Profile;