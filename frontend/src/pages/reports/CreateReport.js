import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const LOCAL_REPORTER_KEY = 'campusfix_local_reporter';

const getStoredLocalReporter = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_REPORTER_KEY) || 'null');
    if (stored && stored.id) {
      return stored;
    }
  } catch (err) {
    console.warn('Failed to parse local reporter profile.', err);
  }
  return null;
};

const persistLocalReporter = (reporter) => {
  try {
    localStorage.setItem(LOCAL_REPORTER_KEY, JSON.stringify(reporter));
  } catch (err) {
    console.warn('Failed to persist local reporter profile.', err);
  }
};

const buildReporterProfile = (user) => {
  if (user) {
    const reporter = {
      id: user.id,
      name: user.name || user.email || 'Student Reporter',
      email: user.email || '',
      studentId: user.studentId || '',
      role: user.role || 'student'
    };
    persistLocalReporter(reporter);
    return reporter;
  }

  const stored = getStoredLocalReporter();
  if (stored) {
    return stored;
  }

  const fallbackReporter = {
    id: `local-user-${Date.now()}`,
    name: 'Student Reporter',
    email: '',
    studentId: '',
    role: 'student'
  };
  persistLocalReporter(fallbackReporter);
  return fallbackReporter;
};

const CreateReport = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    location: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    'Academic',
    'Administrative',
    'Facilities',
    'Safety',
    'Technology',
    'Other'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const resolveCurrentUser = async () => {
    if (authUser) {
      persistLocalReporter({
        id: authUser.id,
        name: authUser.name || authUser.email || 'Student Reporter',
        email: authUser.email || '',
        studentId: authUser.studentId || '',
        role: authUser.role || 'student'
      });
      return authUser;
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (data?.user) {
        const resolvedUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          studentId: data.user.user_metadata?.studentId || '',
          role: data.user.user_metadata?.role || 'student'
        };
        persistLocalReporter(resolvedUser);
        return resolvedUser;
      }
    } catch (err) {
      console.warn('Unable to fetch Supabase user:', err?.message || err);
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!form.title || !form.description || !form.category || !form.location) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // 1. Get logged-in user (from context or Supabase)
      const activeUser = await resolveCurrentUser();
      const reporter = buildReporterProfile(activeUser);
      if (!activeUser) {
        toast.info('Submitting report offline. Please sign in later to sync with your account.');
      }

      let photoPath = null;

      // 2. Upload file if selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${reporter.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without file if upload fails
        } else {
          const { data: publicUrl } = supabase.storage
            .from("reports")
            .getPublicUrl(fileName);
          photoPath = publicUrl.publicUrl;
        }
      }

      const createdAt = new Date().toISOString();
      const dbPayload = {
        student_id: reporter.id,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        photo_url: photoPath,
        status: "Pending",
        created_at: createdAt,
        location: form.location
      };

      let createdReport = null;
      let savedLocally = false;

      try {
        const { data: insertedReports, error: insertError } = await supabase
          .from("reports")
          .insert([dbPayload])
          .select();

        if (insertError) {
          throw insertError;
        }

        createdReport = insertedReports?.[0]
          ? {
              ...insertedReports[0],
              owner_id: reporter.id,
              student_name: reporter.name,
              student_email: reporter.email,
              student_number: reporter.studentId
            }
          : null;
      } catch (dbError) {
        console.error('Database error:', dbError);
        savedLocally = true;
        createdReport = {
          id: `demo-report-${Date.now()}`,
          owner_id: reporter.id,
          student_id: reporter.id,
          student_name: reporter.name,
          student_email: reporter.email,
          student_number: reporter.studentId,
          title: form.title,
          description: form.description,
          category: form.category,
          priority: form.priority,
          photo_url: photoPath,
          status: "Pending",
          created_at: createdAt,
          location: form.location
        };
      }

      // Always save to localStorage for admin dashboard visibility
      if (createdReport) {
        try {
          const existing = JSON.parse(localStorage.getItem('demo_reports') || '[]');
          const filteredExisting = Array.isArray(existing)
            ? existing.filter(report => report.id !== createdReport.id)
            : [];
          localStorage.setItem('demo_reports', JSON.stringify([createdReport, ...filteredExisting]));
        } catch (cacheError) {
          console.warn('Failed to update local reports cache.', cacheError);
        }

        window.dispatchEvent(new CustomEvent('demo_reports_updated', { detail: { report: createdReport, type: 'created' } }));
      }

      toast.success('Report submitted successfully!');
      if (savedLocally) {
        toast.warning('Report saved locally (database connection issue)');
      }

      setSuccess(true);
      setForm({ title: '', description: '', category: '', priority: 'Medium', location: '' });
      setFile(null);
      setPreview(null);
      
      setTimeout(() => {
        navigate('/reports', { 
          state: { 
            successMessage: 'Report submitted successfully!',
            highlightReportId: createdReport?.id || createdReport?._id || null
          } 
        });
      }, 1500);
    } catch (err) {
      console.error("Error submitting report:", err);
      setError(err.message || 'Failed to submit report. Please try again.');
      toast.error('Failed to submit report. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Report</h1>
            <p className="text-gray-600">Submit a detailed report about campus issues or concerns</p>
          </div>
          <Link 
            to="/reports" 
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reports
          </Link>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Report submitted successfully! Redirecting...
          </motion.div>
        )}

        <motion.form 
          onSubmit={handleSubmit} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Report Title *
                </label>
                <input 
                  name="title" 
                  value={form.title} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  placeholder="Enter report title" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Category *
                </label>
                <select 
                  name="category" 
                  value={form.category} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 12.414A2 2 0 0012 12a2 2 0 00-1.414.414l-4.243 4.243M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location *
                </label>
                <input 
                  name="location" 
                  value={form.location} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  placeholder="Enter the location of the issue (e.g., Block A, Room 204)" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Priority
                </label>
                <select 
                  name="priority" 
                  value={form.priority} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description *
                </label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  rows="6" 
                  placeholder="Describe the issue or concern in detail" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Supporting Document (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-200">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {preview ? (
                      <div className="space-y-3">
                        <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border shadow-sm" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                            setPreview(null);
                            document.getElementById('file-upload').value = '';
                          }}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Upload supporting document</p>
                          <p className="text-xs text-gray-500">Click to select or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-1">Images, PDF, DOC up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <Link
                to="/reports"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Link>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Submit Report
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateReport;
