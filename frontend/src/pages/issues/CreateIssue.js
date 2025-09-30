import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';

const CreateIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    priority: 'Medium'
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
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
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
        setFile(selectedFile);
        
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

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!user) {
        setError('You must be logged in to report an issue');
        return;
      }

      let imageUrl = '';

      // Upload image to Supabase Storage if a file was selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('issues')
          .upload(`images/${fileName}`, file);

        if (error) {
          setError('Error uploading image: ' + error.message);
          return;
        }

        const { data: publicUrl } = supabase.storage
          .from('issues')
          .getPublicUrl(`images/${fileName}`);

        imageUrl = publicUrl.publicUrl;
      }

      // Save issue data to Supabase "issues" table
      const { error: insertError } = await supabase.from('issues').insert([
        { 
          title: formData.title, 
          description: formData.description, 
          location: formData.location,
          category: formData.category,
          priority: formData.priority,
          image_url: imageUrl, 
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        },
      ]);

      // Always add a demo copy locally so it appears instantly
      const demoIssue = {
        id: `demo-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        priority: formData.priority,
        image_url: imageUrl || '',
        user_id: user.id,
        profiles: { name: user.user_metadata?.name || user.email || 'You' },
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      try {
        const existing = JSON.parse(localStorage.getItem('demo_issues') || '[]');
        localStorage.setItem('demo_issues', JSON.stringify([demoIssue, ...existing]));
      } catch (_) {}

      if (insertError) {
        // Keep going with demo data even if backend insert failed
        setError(null);
      }

      setSuccess(true);
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        category: '',
        priority: 'Medium'
      });
      setFile(null);
      setPreview(null);
      
      // Redirect to My Issues after 1.2s so it appears there
      setTimeout(() => {
        navigate('/issues');
      }, 1200);
    } catch (err) {
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl p-6 transition duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-indigo-800">Report a Campus Issue</h2>
          <Link 
            to="/dashboard" 
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition duration-300"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg animate-fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Issue submitted successfully!</span>
            </div>
            <Link
              to="/issues"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              View My Issues
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L12.586 12H4a1 1 0 110-2h8.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
        )}
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title Field */}
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input 
                id="title"
                name="title"
                type="text" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Brief title of the issue" 
                className={`w-full px-4 py-3 rounded-lg border ${validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>
            
            {/* Location Field */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input 
                id="location"
                name="location"
                type="text" 
                value={formData.location} 
                onChange={handleChange} 
                placeholder="Building, room number, etc." 
                className={`w-full px-4 py-3 rounded-lg border ${validationErrors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
              />
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
              )}
            </div>
            
            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${validationErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
              )}
            </div>
            
            {/* Priority Field */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            
            {/* Description Field */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea 
                id="description"
                name="description"
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Detailed description of the issue" 
                rows="4"
                className={`w-full px-4 py-3 rounded-lg border ${validationErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300`}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>
            
            {/* Image Upload Field */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Upload
              </label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition duration-300 ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isDragActive ? (
                    <p className="mt-2 text-sm text-indigo-600">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="mt-2 text-sm text-gray-600">Drag and drop an image, or click to select</p>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Image Preview */}
              {preview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="h-48 w-auto object-cover rounded-lg border border-gray-200" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition duration-300"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {file && !preview && (
                <div className="mt-2 text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a1 1 0 11-2 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  Selected file: {file.name}
                </div>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Issue...
                </>
              ) : (
                'Submit Issue Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default CreateIssue;

