import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const nowIso = new Date().toISOString();
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, title, description, event_date, created_at')
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true });
      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {events.map((ev) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-4 border border-gray-200 rounded-lg bg-white"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{ev.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{new Date(ev.event_date).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ev.description}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-6">No upcoming events</div>
      )}
    </div>
  );
};

export default EventList;


