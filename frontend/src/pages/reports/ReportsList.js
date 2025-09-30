import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reports for logged-in student
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);

      // Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch reports from Supabase
        const { data } = await supabase
          .from("reports")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        let reports = data || [];

        // Also check local storage for demo reports
        try {
          const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
          const userLocalReports = localReports.filter(report => report.student_id === user.id);
          reports = [...userLocalReports, ...reports];
        } catch (err) {
          console.error('Error parsing local reports:', err);
        }

        setReports(reports);
      } catch (err) {
        console.error("Error fetching reports:", err);
        // Fallback to local storage only
        try {
          const localReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
          const userLocalReports = localReports.filter(report => report.student_id === user.id);
          setReports(userLocalReports);
        } catch (localErr) {
          console.error('Error parsing local reports:', localErr);
          setReports([]);
        }
      }

      setLoading(false);
    };

    fetchReports();
  }, []);

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
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{report.description}</p>
                  
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
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReportList;
