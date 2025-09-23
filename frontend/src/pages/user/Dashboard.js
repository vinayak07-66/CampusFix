import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { useDropzone } from 'react-dropzone';
import StudentIssueList from '../../components/user/StudentIssueList';

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const dropdownRef = useRef(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  // Issue form state
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    category: '',
    location: ''
  });
  const [issueFile, setIssueFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Categories for issue form
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
  
  // Close dropdown when clicking outside (dropdown not currently used on page, keep for future use)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // no-op
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Setup dropzone for file uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 10485760, // 10MB
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setIssueFile(selectedFile);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);
      }
    }
  });
  
  // Cleanup preview URL when component unmounts or when file changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  
  // Handle issue form input changes
  const handleIssueFormChange = (e) => {
    const { name, value } = e.target;
    setIssueForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Remove selected file
  const handleRemoveFile = () => {
    setIssueFile(null);
    setPreview(null);
  };
  
  // Validate issue form
  const validateIssueForm = () => {
    const errors = {};
    
    if (!issueForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!issueForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!issueForm.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!issueForm.category) {
      errors.category = 'Category is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit issue form
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateIssueForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let imageUrl = '';
      
      // Upload image to Supabase Storage if a file was selected
      if (issueFile) {
        const fileExt = issueFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error } = await supabase.storage
          .from('issues')
          .upload(`images/${fileName}`, issueFile);

        if (error) {
          console.error('Error uploading image:', error);
        } else {
          const { data: publicUrl } = supabase.storage
            .from('issues')
            .getPublicUrl(`images/${fileName}`);

          imageUrl = publicUrl.publicUrl;
        }
      }
      
      // Save issue data to Supabase "issues" table
      const { error: insertError } = await supabase.from('issues').insert([
        { 
          title: issueForm.title, 
          description: issueForm.description, 
          location: issueForm.location,
          category: issueForm.category,
          priority: 'Medium', // Default priority
          image_url: imageUrl, 
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        },
      ]);

      if (insertError) {
        console.error('Error reporting issue:', insertError);
      } else {
        setSubmitSuccess(true);
        // Reset form
        setIssueForm({
          title: '',
          description: '',
          location: '',
          category: ''
        });
        setIssueFile(null);
        setPreview(null);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('An unexpected error occurred:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Fetch upcoming events
      const today = new Date().toISOString();
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(3);
      
      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        setUpcomingEvents(events || []);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  }, [user]);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && (
        <div className="max-w-7xl mx-auto">
          {/* Header with User Info */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome, {user?.name || user?.email}
            </h1>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
          
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Quick Actions
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <Link 
                    to="/issues/create" 
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition duration-300 transform hover:-translate-y-1 border border-blue-100"
                  >
                    <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Report Issue</span>
                  </Link>
                  
                  <Link 
                    to="/issues" 
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition duration-300 transform hover:-translate-y-1 border border-purple-100"
                  >
                    <svg className="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">My Issues</span>
                  </Link>
                  
                  <Link 
                    to="/events" 
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl hover:shadow-md transition duration-300 transform hover:-translate-y-1 border border-green-100"
                  >
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Events</span>
                  </Link>
                </div>
              </div>
              
              {/* My Issues Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    My Issues
                  </h2>
                  <Link to="/issues" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-200">
                    View All
                  </Link>
                </div>
                <StudentIssueList userId={user?.id} limit={20} />
              </div>
              
              {/* Upcoming Events Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Upcoming Events
                  </h2>
                  <Link to="/events" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-200">
                    View All
                  </Link>
                </div>
                
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                        <h3 className="font-medium text-gray-800">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(event.date)}</p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                        <div className="mt-3 flex justify-end">
                          <Link 
                            to={`/events/${event.id}`}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition duration-200"
                          >
                            Register
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-gray-600">No upcoming events</p>
                    <Link to="/events" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
                      Browse all events
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Report Issue Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Report Issue
              </h2>
              
              {/* Success Message */}
              {submitSuccess && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">Issue reported successfully!</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleIssueSubmit}>
                <div className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={issueForm.title}
                      onChange={handleIssueFormChange}
                      className={`w-full px-3 py-2 border ${formErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Brief title of the issue"
                    />
                    {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
                  </div>
                  
                  {/* Description Field */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={issueForm.description}
                      onChange={handleIssueFormChange}
                      rows="3"
                      className={`w-full px-3 py-2 border ${formErrors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Detailed description of the issue"
                    ></textarea>
                    {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                  </div>
                  
                  {/* Location Field */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={issueForm.location}
                      onChange={handleIssueFormChange}
                      className={`w-full px-3 py-2 border ${formErrors.location ? 'border-red-300' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Where is the issue located?"
                    />
                    {formErrors.location && <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>}
                  </div>
                  
                  {/* Category Field */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={issueForm.category}
                      onChange={handleIssueFormChange}
                      className={`w-full px-3 py-2 border ${formErrors.category ? 'border-red-300' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {formErrors.category && <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>}
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                    <div 
                      {...getRootProps()} 
                      className={`border-2 border-dashed ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition duration-200`}
                    >
                      <input {...getInputProps()} />
                      {preview ? (
                        <div className="space-y-2">
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="mx-auto h-32 object-cover rounded-lg"
                          />
                          <button 
                            type="button" 
                            onClick={handleRemoveFile}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove image
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="text-sm">
                            Drag and drop an image here, or click to select
                          </p>
                          <p className="text-xs">
                            (JPEG, PNG, GIF up to 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : 'Submit Issue'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;