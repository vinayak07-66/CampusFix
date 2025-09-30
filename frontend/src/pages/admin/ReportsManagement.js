import React from 'react';
import ReportManagement from '../../components/admin/ReportManagement';

const ReportsManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and update the status of student reports.
          </p>
        </div>
        
        <ReportManagement />
      </div>
    </div>
  );
};

export default ReportsManagement;
