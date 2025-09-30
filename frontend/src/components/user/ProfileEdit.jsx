import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useDropzone } from 'react-dropzone';

const ProfileEdit = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    profilePhoto: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        department: user.department || '',
        profilePhoto: null
      });
    }
  }, [user]);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        profilePhoto: acceptedFiles[0]
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB limit
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadProfilePhoto = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('report-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('report-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let profilePhotoUrl = null;
      
      // Upload profile photo if provided
      if (formData.profilePhoto) {
        profilePhotoUrl = await uploadProfilePhoto(formData.profilePhoto);
      }

      // Update user profile
      const updateData = {
        name: formData.name,
        studentId: formData.studentId,
        department: formData.department,
        ...(profilePhotoUrl && { profileImage: profilePhotoUrl })
      };

      const success = await updateProfile(updateData);
      
      if (success) {
        setSuccess('Profile updated successfully!');
        // Reset photo selection
        setFormData(prev => ({
          ...prev,
          profilePhoto: null
        }));
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <div className="flex items-center space-x-6">
            {/* Current Profile Photo */}
            <div className="flex-shrink-0">
              {user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt="Current profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Photo Upload Area */}
            <div
              {...getRootProps()}
              className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {formData.profilePhoto ? (
                <div className="space-y-2">
                  <img
                    src={URL.createObjectURL(formData.profilePhoto)}
                    alt="Preview"
                    className="mx-auto max-h-16 rounded-lg"
                  />
                  <p className="text-sm text-gray-600">{formData.profilePhoto.name}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, profilePhoto: null }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div>
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the photo here...'
                      : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email Field (Read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        {/* Student ID Field */}
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
            Student ID
          </label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your student ID"
          />
        </div>

        {/* Department Field */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your department"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: user?.name || '',
                email: user?.email || '',
                studentId: user?.studentId || '',
                department: user?.department || '',
                profilePhoto: null
              });
              setError('');
              setSuccess('');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
