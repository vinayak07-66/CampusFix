import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import StatusDropdown from './StatusDropdown';
import { toast } from 'sonner';

const tableHeaderClass = 'px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50';
const cellClass = 'px-4 py-3 align-top text-sm text-gray-800 border-t';

const IssueTable = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('issues')
        .select('id, student_id, title, description, image_url, status, created_at, profiles!inner(name)')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setIssues(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch issues');
      toast.error(err.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        (payload) => {
          setIssues((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((it) => (it.id === payload.new.id ? payload.new : it));
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((it) => it.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const rows = useMemo(() => issues, [issues]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className={tableHeaderClass}>Student ID</th>
            <th className={tableHeaderClass}>Title</th>
            <th className={tableHeaderClass}>Description</th>
            <th className={tableHeaderClass}>Image</th>
            <th className={tableHeaderClass}>Status</th>
            <th className={tableHeaderClass}>Created</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((issue) => (
              <motion.tr
                key={issue.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="hover:bg-gray-50"
              >
                <td className={cellClass}>{issue.profiles?.name || issue.student_id}</td>
                <td className={cellClass}>{issue.title}</td>
                <td className={cellClass}>
                  <div className="max-w-xs line-clamp-3 text-gray-700">{issue.description}</div>
                </td>
                <td className={cellClass}>
                  {issue.image_url ? (
                    <img src={issue.image_url} alt="issue" className="h-14 w-20 object-cover rounded-md border" />
                  ) : (
                    <span className="text-gray-400 text-xs">No image</span>
                  )}
                </td>
                <td className={cellClass}>
                  <StatusDropdown
                    issueId={issue.id}
                    status={issue.status}
                    onStatusChange={(next) => {
                      setIssues((prev) => prev.map((it) => (it.id === issue.id ? { ...it, status: next } : it)));
                    }}
                  />
                </td>
                <td className={cellClass}>{new Date(issue.created_at).toLocaleString()}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">No issues found</div>
      )}
    </div>
  );
};

export default IssueTable;


