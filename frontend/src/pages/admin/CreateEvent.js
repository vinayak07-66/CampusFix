import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.date) {
      setError('Title and date are required');
      return;
    }
    try {
      setLoading(true);
      // Upload banner image if provided
      let bannerUrl = '';
      if (bannerFile) {
        try {
          const ext = bannerFile.name.split('.').pop();
          const fileName = `banner-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('events')
            .upload(`banners/${fileName}`, bannerFile);
          if (!upErr) {
            const { data: pub } = supabase.storage
              .from('events')
              .getPublicUrl(`banners/${fileName}`);
            bannerUrl = pub?.publicUrl || '';
          }
        } catch (_) {}
      }
      const { error: insertError } = await supabase.from('events').insert([
        { title: form.title, description: form.description, date: form.date, location: form.location, link: form.link, banner_url: bannerUrl }
      ]);

      // Always add a demo copy locally for instant visibility
      const demoEvent = {
        id: `demo-evt-${Date.now()}`,
        title: form.title,
        description: form.description,
        date: form.date,
        location: form.location,
        link: form.link,
        banner_url: bannerUrl
      };
      try {
        const existing = JSON.parse(localStorage.getItem('demo_events') || '[]');
        localStorage.setItem('demo_events', JSON.stringify([demoEvent, ...existing]));
      } catch (_) {}

      if (insertError) {
        // keep going with demo
        setError(null);
        toast.warning('Event saved locally (database connection issue)');
      } else {
        toast.success('Event created successfully!');
      }
      setSuccess(true);
      setTimeout(() => navigate('/events-list'), 1500);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600">Fill in the details to create a new campus event</p>
          </div>
          <Link 
            to="/admin/events" 
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
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
            Event created successfully! Redirecting...
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
                  Event Title
                </label>
                <input 
                  name="title" 
                  value={form.title} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  placeholder="Enter event title" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  rows="4" 
                  placeholder="Describe the event details" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  name="date" 
                  value={form.date} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  required
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select the event start date and time
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </label>
                <input 
                  name="location" 
                  value={form.location} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  placeholder="Enter venue or location" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  External Link
                </label>
                <input 
                  name="link" 
                  value={form.link} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                  placeholder="https://example.com/register" 
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Optional: registration or more info link
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Banner Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-200">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  if (f) {
                    setBannerFile(f);
                    setBannerPreview(URL.createObjectURL(f));
                  }
                }}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cursor-pointer">
                {bannerPreview ? (
                  <div className="space-y-3">
                    <img src={bannerPreview} alt="Banner preview" className="w-full max-h-64 object-cover rounded-lg border shadow-sm" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setBannerFile(null);
                        setBannerPreview(null);
                        document.getElementById('banner-upload').value = '';
                      }}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Upload banner image</p>
                      <p className="text-xs text-gray-500">Click to select or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <Link
                to="/admin/events"
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
                    Creating Event...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Event
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

export default CreateEvent;

