import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import IssueTable from '../../components/admin/IssueTable';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const demoIssues = [
  {
    id: 'demo-1',
    title: 'Broken fan',
    description: 'Fan not working in classroom',
    location: 'Room 101',
    category: 'Electrical',
    priority: 'Medium',
    status: 'Pending',
    image_url: '',
    created_at: new Date().toISOString(),
    profiles: { name: 'John Doe' }
  },
  {
    id: 'demo-2',
    title: 'Water leakage in washroom',
    description: 'Continuous water leakage observed near sink',
    location: 'Block B - 2nd Floor',
    category: 'Plumbing',
    priority: 'High',
    status: 'In Progress',
    image_url: '',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    profiles: { name: 'Jane Smith' }
  },
  {
    id: 'demo-3',
    title: 'WiFi down in library',
    description: 'No connectivity in north section of library',
    location: 'Library - North Wing',
    category: 'Network',
    priority: 'Critical',
    status: 'Resolved',
    image_url: '',
    created_at: new Date(Date.now() - 2*86400000).toISOString(),
    profiles: { name: 'Rahul Sharma' }
  }
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatsAndRecent = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { count: total } = await supabase.from('issues').select('*', { count: 'exact' }).count();
      const { count: open } = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .or('status.eq.Pending,status.eq.In Progress')
        .count();
      const { count: resolved } = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .eq('status', 'Resolved')
        .count();

      const { data: recentIssues, error: recentErr } = await supabase
        .from('issues')
        .select('id, title, status, priority, category, created_at, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentErr) throw recentErr;

      // Merge local demo for recent only
      let recentMerged = recentIssues || [];
      try {
        const localDemo = JSON.parse(localStorage.getItem('demo_issues') || '[]');
        recentMerged = [...localDemo.slice(0, 3), ...recentMerged].slice(0, 5);
      } catch (_) {}
      setStats({ total: (total || 0), open: (open || 0), resolved: (resolved || 0) });
      setRecent(recentMerged);
      
      if (isRefresh) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      // Fallback to demo data when there is no backend/table
      setStats({ total: demoIssues.length, open: 2, resolved: 1 });
      setRecent(demoIssues.slice(0, 3));
      setError(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecent();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage reported issues and campus maintenance</p>
          </div>
          <button
            onClick={() => fetchStatsAndRecent(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            <svg 
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Issues</div>
              <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Open Issues</div>
              <div className="text-3xl font-bold text-amber-600">{stats.open}</div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Resolved</div>
              <div className="text-3xl font-bold text-emerald-600">{stats.resolved}</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Issues */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Issues
          </h2>
          <a 
            href="/admin/issues" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center"
          >
            View all
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-500">Loading recent issues...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {(recent.length ? recent : demoIssues).map((it, index) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 mb-1">{it.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">{it.category}</span>
                      <span>•</span>
                      <span>{new Date(it.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span>{it.profiles?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      it.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      it.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      it.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {it.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      it.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      it.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {it.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Full Issues Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <IssueTable />
      </motion.div>
    </div>
  );
};

export default AdminDashboard;