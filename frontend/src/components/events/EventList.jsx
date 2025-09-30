import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      let rows = data || [];
      // Merge locally stored demo events for instant visibility
      try {
        const localDemo = JSON.parse(localStorage.getItem('demo_events') || '[]');
        rows = [...localDemo, ...rows];
      } catch (_) {}
      setEvents(rows);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const isToday = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    
    if (isToday(dateString)) {
      return { status: 'today', color: 'bg-blue-100 text-blue-800', label: 'Today' };
    } else if (eventDate < now) {
      return { status: 'past', color: 'bg-gray-100 text-gray-800', label: 'Past' };
    } else {
      return { status: 'upcoming', color: 'bg-green-100 text-green-800', label: 'Upcoming' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no events scheduled at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Campus Events</h2>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {events.map((event) => {
          const eventStatus = getEventStatus(event.date);
          
          return (
            <div key={event.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {event.banner_url && (
                <div className="w-full h-44 bg-gray-100">
                  <img src={event.banner_url} alt="Event banner" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-gray-600 mb-4">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventStatus.color}`}>
                      {eventStatus.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatDate(event.date)}</span>
                </div>

                {(event.link || event.location) && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      {event.location && (
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">Event Link</a>
                    )}
                  </div>
                )}

                {isToday(event.date) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-blue-800 font-medium">This event is happening today!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;