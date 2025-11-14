import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const LOCAL_REPORTER_KEY = 'campusfix_local_reporter';

const getStoredReporterProfile = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_REPORTER_KEY) || 'null');
    if (stored && stored.id) {
      return stored;
    }
  } catch (err) {
    console.warn('Failed to read stored reporter profile.', err);
  }
  return null;
};

const ReportList = () => {
  const { user: authUser } = useAuth();
  const fallbackReporterRef = useRef(getStoredReporterProfile());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [highlightReportId, setHighlightReportId] = useState(null);
  const highlightRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchReports = useCallback(async (withLoader = false) => {
    if (withLoader) {
      setLoading(true);
    }

    let resolvedUser = authUser || null;

    if (!resolvedUser) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          resolvedUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            studentId: data.user.user_metadata?.studentId || '',
            role: data.user.user_metadata?.role || 'student'
          };
          fallbackReporterRef.current = resolvedUser;
        }
      } catch (err) {
        console.warn('Supabase user lookup failed while fetching reports.', err);
      }
    } else {
      fallbackReporterRef.current = resolvedUser;
    }

    const reporterProfile = fallbackReporterRef.current || getStoredReporterProfile();
    if (!fallbackReporterRef.current && reporterProfile) {
      fallbackReporterRef.current = reporterProfile;
    }

    const reporterId = (resolvedUser || reporterProfile)?.id;

    if (!reporterId) {
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        setReports(Array.isArray(localReports) ? localReports : []);
      } catch (localErr) {
        console.error('Error parsing local reports:', localErr);
        setReports([]);
      }
      setLoading(false);
      return;
    }

    try {
      let mergedReports = [];

      // Fetch reports from Supabase when we have a resolved session
      if (resolvedUser?.id) {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("student_id", resolvedUser.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        mergedReports = data || [];
      }

      // Also check local storage for demo reports
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        const userLocalReports = Array.isArray(localReports)
          ? localReports.filter(report => (report.owner_id || report.student_id) === reporterId)
          : [];
        mergedReports = [...userLocalReports, ...mergedReports];
      } catch (err) {
        console.error('Error parsing local reports:', err);
      }

      setReports(mergedReports);
    } catch (err) {
      console.error("Error fetching reports:", err);
      // Fallback to local storage only
      try {
        const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        const userLocalReports = Array.isArray(localReports)
          ? localReports.filter(report => (report.owner_id || report.student_id) === reporterId)
          : [];
        setReports(userLocalReports);
      } catch (localErr) {
        console.error('Error parsing local reports:', localErr);
        setReports([]);
      }
    }

    setLoading(false);
  }, [authUser]);

  // Fetch reports for logged-in student
  useEffect(() => {
    fetchReports(true);
  }, [fetchReports]);

  // Subscribe to real-time updates for the user's reports
  useEffect(() => {
    const channel = supabase
      .channel('reports-updates-user')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  useEffect(() => {
    const handleStorageUpdate = (event) => {
      if (!event || event.key === 'demo_reports') {
        fetchReports();
      }
    };

    const handleCustomUpdate = (event) => {
      // Handle status updates from admin dashboard
      if (event && event.detail && event.detail.type === 'status_update') {
        // Immediately update the specific report if it's in the current list
        setReports((prev) =>
          prev.map((report) =>
            report.id === event.detail.id
              ? { ...report, status: event.detail.status, updated_at: new Date().toISOString() }
              : report
          )
        );
      }
      // Always refresh to ensure consistency
      fetchReports();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('demo_reports_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('demo_reports_updated', handleCustomUpdate);
    };
  }, [fetchReports]);

  // Handle success message passed via navigation state
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setHighlightReportId(location.state.highlightReportId || null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!highlightReportId) return;
    const timer = setTimeout(() => setHighlightReportId(null), 6000);
    return () => clearTimeout(timer);
  }, [highlightReportId]);

  useEffect(() => {
    if (highlightReportId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [reports, highlightReportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
              <p className="text-gray-600">View and manage your submitted reports</p>
            </div>
            <Link 
              to="/reports/create" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Submit New Report
            </Link>
          </div>
        </motion.div>

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}

        {reports.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-600 mb-6">You haven't submitted any reports yet. Start by creating your first report.</p>
              <Link 
                to="/reports/create" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Submit Your First Report
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {reports.map((report, index) => {
              const reportIdentifier = report.id ?? report._id ?? index;
              const isHighlighted = highlightReportId !== null && String(reportIdentifier) === String(highlightReportId);

              return (
                <motion.div
                  key={String(reportIdentifier)}
                  ref={isHighlighted ? highlightRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white ${isHighlighted ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
                >
                  {report.photo_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={report.photo_url}
                        alt={report.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{report.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        report.status === 'Pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : report.status === 'In Progress' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-3">{report.description}</p>
                    {report.location && (
                      <div className="text-sm text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 12.414A2 2 0 0012 12a2 2 0 00-1.414.414l-4.243 4.243M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span><span className="font-medium">Location:</span> {report.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {report.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.priority === 'Critical' 
                          ? 'bg-red-100 text-red-800' 
                          : report.priority === 'High' 
                          ? 'bg-orange-100 text-orange-800' 
                          : report.priority === 'Medium' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.priority}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      <Link 
                        to={`/reports`} 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </motion.div>
      )}
    </div>
  </div>
);
};

export default ReportList;
