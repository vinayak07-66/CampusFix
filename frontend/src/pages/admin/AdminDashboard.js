import React from 'react';
import IssueTable from '../../components/admin/IssueTable';

const AdminDashboard = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage reported issues</p>
      </div>
      <IssueTable />
    </div>
  );
};

export default AdminDashboard;