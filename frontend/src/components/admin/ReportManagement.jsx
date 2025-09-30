import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ReportManagement = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // First try to fetch from Supabase
      let reports = [];
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            users:student_id (
              name,
              email,
              student_id
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        reports = data || [];
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue with local storage fallback
      }

      // Also check local storage for demo reports
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        // Transform local reports to match database format
        const transformedLocalReports = localReports.map(report => ({
          ...report,
          users: {
            name: 'Demo User',
            email: 'demo@example.com',
            student_id: report.student_id
          }
        }));
        reports = [...transformedLocalReports, ...reports];
      } catch (err) {
        console.error('Error parsing local reports:', err);
      }

      setReports(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      // Try to update in database first
      try {
        const { error } = await supabase
          .from('reports')
          .update({ status: newStatus })
          .eq('id', reportId);

        if (error) throw error;
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Continue with local storage update
      }

      // Also update local storage if it's a demo report
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        const updatedLocalReports = localReports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        );
        localStorage.setItem('demo_reports', JSON.stringify(updatedLocalReports));
      } catch (localErr) {
        console.error('Local storage update error:', localErr);
      }

      // Update local state
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );

      toast.success('Report status updated successfully');
    } catch (error) {
      console.error('Error updating report status:', error);
      setError('Failed to update report status');
      toast.error('Failed to update report status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.users?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

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
          onClick={fetchReports}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Report Management</h2>
        <button
          onClick={fetchReports}
          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No reports match your current filters.'
                : 'No reports have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{report.description}</p>
                  
                  {/* Student Info */}
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Submitted by:</strong> {report.users?.name || 'Unknown'} 
                      {report.users?.email && ` (${report.users.email})`}
                      {report.users?.student_id && ` - ID: ${report.users.student_id}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Submitted: {formatDate(report.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {report.photo_url && (
                <div className="mb-4">
                  <img
                    src={report.photo_url}
                    alt="Report photo"
                    className="max-w-md max-h-64 rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Status Update Controls */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateReportStatus(report.id, 'Pending')}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      report.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => updateReportStatus(report.id, 'In Progress')}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      report.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateReportStatus(report.id, 'Resolved')}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      report.status === 'Resolved'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  {report.updated_at !== report.created_at && (
                    <span>Updated: {formatDate(report.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
