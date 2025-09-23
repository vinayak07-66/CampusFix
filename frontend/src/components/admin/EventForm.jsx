import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

const EventForm = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      toast.error('Title and date are required');
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.from('events').insert([
        {
          title,
          description,
          event_date: new Date(eventDate).toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      toast.success('Event created');
      setTitle('');
      setDescription('');
      setEventDate('');
      onCreated?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Event description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
        <input
          type="datetime-local"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      </div>
      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;


