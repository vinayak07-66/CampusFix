import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useDropzone } from 'react-dropzone';

const ReportForm = ({ onReportSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        photo: acceptedFiles[0]
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

  const uploadPhoto = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('report-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('report-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let photoUrl = null;
      
      // Upload photo if provided
      if (formData.photo) {
        photoUrl = await uploadPhoto(formData.photo);
      }

      // Create report in database
      const { data, error } = await supabase
        .from('reports')
        .insert({
          student_id: user.id,
          title: formData.title,
          description: formData.description,
          photo_url: photoUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setFormData({
        title: '',
        description: '',
        photo: null
      });

      // Notify parent component
      if (onReportSubmitted) {
        onReportSubmitted(data);
      }

      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Submit a Report</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Report Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of the issue"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide detailed information about the issue..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo (Optional)
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {formData.photo ? (
              <div className="space-y-2">
                <img
                  src={URL.createObjectURL(formData.photo)}
                  alt="Preview"
                  className="mx-auto max-h-32 rounded-lg"
                />
                <p className="text-sm text-gray-600">{formData.photo.name}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, photo: null }));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                    : 'Drag & drop a photo here, or click to select'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({ title: '', description: '', photo: null })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.description}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
