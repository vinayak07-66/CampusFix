// TEMPORARY DEMO MODE — Using localStorage instead of Supabase
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import StatusDropdown from '../../components/admin/StatusDropdown';
import { toast } from 'sonner';
import {
  BarChart3,
  ClipboardList,
  Settings2,
  ArrowUpRight,
  RefreshCcw,
  Clock3,
  Users,
} from 'lucide-react';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Stats & insights' },
  { id: 'all-issues', label: 'All Issues', icon: ClipboardList, description: 'Complete report log' },
  { id: 'manage', label: 'Manage Issues', icon: Settings2, description: 'Update progress & status' },
];

const statusBadgeClass = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'In Progress':
      return 'bg-amber-50 text-amber-600 border border-amber-100';
    default:
      return 'bg-sky-50 text-sky-600 border border-sky-100';
  }
};

const priorityBadgeClass = (priority) => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-50 text-red-600 border border-red-100';
    case 'High':
      return 'bg-orange-50 text-orange-600 border border-orange-100';
    case 'Medium':
      return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
    default:
      return 'bg-lime-50 text-lime-600 border border-lime-100';
  }
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatDuration = (ms) => {
  if (!ms || Number.isNaN(ms)) return 'N/A';
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

// Helper function to create safe fallback issue - moved outside component for stability
const createSafeIssue = (issue) => ({
  id: issue.id || 'N/A',
  title: issue.title || 'Untitled',
  description: issue.description || 'No description provided',
  category: issue.category || 'General',
  priority: issue.priority || 'Normal',
  status: issue.status || 'Pending',
  created_at: issue.created_at || new Date().toISOString(),
  updated_at: issue.updated_at || issue.created_at || new Date().toISOString(),
  profiles: issue.profiles || { name: 'Unknown' },
  image_url: issue.image_url || null,
  location: issue.location || 'N/A',
  user_id: issue.user_id || null,
});

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [issues, setIssues] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [manageSearch, setManageSearch] = useState('');
  const [manageFilter, setManageFilter] = useState('All');

  // Load reports from localStorage
  const loadReports = useCallback(() => {
    try {
      const storedReports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
      const safeReports = Array.isArray(storedReports) 
        ? storedReports.map(report => ({
            id: report.id || `report-${Date.now()}`,
            title: report.title || 'Untitled Report',
            description: report.description || 'No description',
            category: report.category || 'General',
            priority: report.priority || 'Medium',
            status: report.status || 'Pending',
            created_at: report.created_at || new Date().toISOString(),
            updated_at: report.updated_at || report.created_at || new Date().toISOString(),
            photo_url: report.photo_url || null,
            student_name: report.student_name || report.student_email || 'Unknown Student',
            student_email: report.student_email || '',
            student_id: report.student_id || report.owner_id || null,
            profiles: { name: report.student_name || report.student_email || 'Unknown Student' }
          }))
        : [];
      setReports(safeReports);
      return safeReports;
    } catch (err) {
      console.error('Error loading reports from localStorage:', err);
      setReports([]);
      return [];
    }
  }, []);

  const loadIssues = useCallback(
    async (mode = 'initial') => {
      const showInitialSpinner = mode === 'initial';
      const showRefreshSpinner = mode === 'refresh';
      if (showInitialSpinner) setLoading(true);
      if (showRefreshSpinner) setRefreshing(true);

      try {
        // Load reports from localStorage
        loadReports();

        // Start with the most basic query - just select all columns, no joins, no filters
        let data = null;
        let fetchError = null;

        // Try fetching with select("*") first - this avoids schema validation issues
        try {
          const result = await supabase
            .from('issues')
            .select('*')
            .order('created_at', { ascending: false });
          
          data = result.data;
          fetchError = result.error;
        } catch (err) {
          console.warn('Initial fetch failed:', err);
          fetchError = err;
        }

        // If that fails, try an even simpler approach
        if (fetchError) {
          console.warn('Fetch error, trying minimal query:', fetchError);
          try {
            const fallbackResult = await supabase
              .from('issues')
              .select('*')
              .limit(1000); // Limit to avoid huge queries
            
            if (!fallbackResult.error) {
              data = fallbackResult.data;
              fetchError = null;
            }
          } catch (fallbackErr) {
            console.error('Fallback fetch also failed:', fallbackErr);
          }
        }

        // Apply safe fallbacks to all issues - this ensures all expected fields exist
        const safeIssues = (data || []).map(createSafeIssue);
        setIssues(safeIssues);

        if (mode === 'refresh') {
          toast.success('Dashboard refreshed');
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        // Don't crash - just show empty state
        setIssues([]);
      } finally {
        if (showInitialSpinner) setLoading(false);
        if (showRefreshSpinner) setRefreshing(false);
      }
    },
    [loadReports]
  );

  useEffect(() => {
    loadIssues('initial');
    loadReports();
  }, [loadIssues, loadReports]);

  // Listen for localStorage changes (reports updates)
  useEffect(() => {
    const handleStorageChange = () => {
      loadReports();
    };

    const handleCustomEvent = () => {
      loadReports();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('demo_reports_updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('demo_reports_updated', handleCustomEvent);
    };
  }, [loadReports]);

  useEffect(() => {
    // Set up real-time subscription for new issues
    const channel = supabase
      .channel('admin-dashboard-issues')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        (payload) => {
          // When a new issue is inserted, add it to the list immediately with safe fallbacks
          if (payload.eventType === 'INSERT' && payload.new) {
            const newIssue = createSafeIssue(payload.new);
            setIssues((prev) => [newIssue, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update existing issue with safe fallbacks
            const updatedIssue = createSafeIssue(payload.new);
            setIssues((prev) =>
              prev.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue))
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted issue
            setIssues((prev) => prev.filter((issue) => issue.id !== payload.old.id));
          } else {
            // Fallback: reload all issues
            loadIssues('silent');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadIssues]);

  // Combine issues and reports for analytics
  const allItems = useMemo(() => {
    // Convert reports to issue-like format for unified display
    const reportItems = reports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at,
      image_url: report.photo_url,
      profiles: report.profiles,
      user_id: report.student_id,
      location: report.location, // include location for reports
      isReport: true // Flag to identify as report
    }));
    
    return [...issues, ...reportItems].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [issues, reports]);

  const analytics = useMemo(() => {
    if (!allItems.length) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        averageResolution: null,
        latestIssues: [],
      };
    }

    // Use safe status access with fallbacks
    const pending = allItems.filter((item) => (item.status || 'Pending') === 'Pending').length;
    const inProgress = allItems.filter((item) => (item.status || 'Pending') === 'In Progress').length;
    const resolvedItems = allItems.filter((item) => (item.status || 'Pending') === 'Resolved');

    const avgResolutionMs = resolvedItems.reduce((acc, item) => {
      const created = item.created_at ? new Date(item.created_at).getTime() : null;
      const resolved = item.updated_at ? new Date(item.updated_at).getTime() : null;
      if (!created || !resolved || resolved < created) {
        return acc;
      }
      return acc + (resolved - created);
    }, 0) / (resolvedItems.length || 1);

    return {
      total: allItems.length,
      pending,
      inProgress,
      resolved: resolvedItems.length,
      averageResolution: resolvedItems.length ? avgResolutionMs : null,
      latestIssues: allItems.slice(0, 5),
    };
  }, [allItems]);

  const filteredAllIssues = useMemo(() => allItems, [allItems]);

  const filteredManageIssues = useMemo(() => {
    return allItems.filter((item) => {
      // Safe status matching - use fallback status if needed
      const itemStatus = item.status || 'Pending';
      const matchesStatus = manageFilter === 'All' || itemStatus === manageFilter;
      
      // Safe search - only search in fields that definitely exist
      const query = manageSearch.trim().toLowerCase();
      const matchesQuery =
        !query ||
        (item.title || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        (item.profiles?.name || '').toLowerCase().includes(query) ||
        // Only search category if it exists (safe fallback already applied)
        (item.category || '').toLowerCase().includes(query);
      
      return matchesStatus && matchesQuery;
    });
  }, [allItems, manageFilter, manageSearch]);

  const handleManualRefresh = () => loadIssues('refresh');

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
      <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
          <div>
              <p className="text-sm font-medium text-slate-500">Total Reports</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{analytics.total}</p>
            </div>
            <div className="rounded-full bg-sky-100 p-3 text-sky-600">
              <ClipboardList className="h-5 w-5" />
            </div>
        </div>
      </motion.div>

      <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">{analytics.pending}</p>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">In Progress</p>
              <p className="mt-2 text-3xl font-semibold text-sky-600">{analytics.inProgress}</p>
            </div>
            <div className="rounded-full bg-sky-100 p-3 text-sky-600">
              <Settings2 className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Resolved</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{analytics.resolved}</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Issues</h3>
              <p className="text-sm text-slate-500">Latest submissions from students</p>
        </div>
          </div>
          <div className="space-y-4">
            {analytics.latestIssues.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No issues reported yet.
          </div>
        ) : (
              analytics.latestIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {issue.title}
                      {issue.isReport && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">(Report)</span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-slate-600 shadow-sm">
                        {issue.category || 'General'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-500 shadow-sm">
                        {issue.profiles?.name || 'Unknown student'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-500 shadow-sm">
                        {formatDateTime(issue.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadgeClass(issue.priority)}`}>
                      {issue.priority || 'Medium'}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
      </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Average Resolution Time</h3>
              <p className="text-sm text-slate-500">Based on resolved cases</p>
            </div>
            <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-6 text-3xl font-semibold text-indigo-600">
            {formatDuration(analytics.averageResolution)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Tracks time between submission and most recent update marked as resolved.
          </p>
        </motion.div>
      </div>
    </div>
  );

  const renderAllIssuesTab = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredAllIssues.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  No issues or reports to display.
                </td>
              </tr>
            ) : (
              filteredAllIssues.map((issue) => (
                <tr key={issue.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{issue.id}</td>
                  <td className="px-6 py-4 text-slate-800">
                    <div className="flex flex-col">
                      <span>{issue.title}</span>
                      {issue.location && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21s-7-4.438-7-11a7 7 0 1114 0c0 6.562-7 11-7 11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          <span className="truncate max-w-[220px]">{issue.location}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {issue.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{issue.profiles?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      issue.isReport 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {issue.isReport ? 'Report' : 'Issue'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatDateTime(issue.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderManageTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setManageFilter(status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                manageFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <input
            type="search"
            value={manageSearch}
            onChange={(e) => setManageSearch(e.target.value)}
            placeholder="Search by title, category or student"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Updated</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredManageIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No matching issues or reports found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredManageIssues.map((issue) => (
                    <motion.tr
                      key={issue.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4 text-slate-800">
                        <div className="flex flex-col">
                          <span>{issue.title}</span>
                          {issue.location && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                              <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21s-7-4.438-7-11a7 7 0 1114 0c0 6.562-7 11-7 11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                              <span className="truncate max-w-[220px]">{issue.location}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {issue.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadgeClass(issue.priority)}`}>
                          {issue.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{issue.profiles?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          issue.isReport 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {issue.isReport ? 'Report' : 'Issue'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDateTime(issue.updated_at || issue.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <StatusDropdown
                          issueId={issue.id}
                          status={issue.status}
                          isReport={issue.isReport}
                          onStatusChange={(next) => {
                            // Update local state immediately for UI responsiveness
                            // StatusDropdown component handles the actual persistence
                            if (issue.isReport) {
                              setReports((prev) =>
                                prev.map((r) =>
                                  r.id === issue.id
                                    ? { ...r, status: next, updated_at: new Date().toISOString() }
                                    : r
                                )
                              );
                              // Reload reports to ensure consistency
                              setTimeout(() => loadReports(), 100);
                            } else {
                              setIssues((prev) =>
                                prev.map((item) =>
                                  item.id === issue.id
                                    ? { ...item, status: next, updated_at: new Date().toISOString() }
                                    : item
                                )
                              );
                            }
                          }}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Admin Control Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor, manage, and resolve campus maintenance reports in real time.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      {loading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
          <p className="mt-4 text-sm text-slate-500">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200/80 bg-white p-1 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {activeTab === 'analytics' && renderAnalyticsTab()}
            {activeTab === 'all-issues' && renderAllIssuesTab()}
            {activeTab === 'manage' && renderManageTab()}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;