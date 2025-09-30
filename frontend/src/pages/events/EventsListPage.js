import React from 'react';
import EventList from '../../components/events/EventList';

const EventsListPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campus Events</h1>
          <p className="mt-2 text-gray-600">
            Stay updated with upcoming campus events and activities.
          </p>
        </div>
        
        <EventList />
      </div>
    </div>
  );
};

export default EventsListPage;
