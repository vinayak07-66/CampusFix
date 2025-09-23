import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const statusSteps = ['Pending', 'In Progress', 'Completed'];

const Step = ({ label, active, done }) => (
  <div className="flex items-center">
    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold border ${
      done ? 'bg-green-600 text-white border-green-600' : active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'
    }`}>
      {done ? '✓' : active ? '•' : ''}
    </div>
    <span className={`ml-2 text-xs ${done || active ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
  </div>
);

const StudentIssueList = ({ userId, limit = 20 }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('issues')
        .select('id, title, description, image_url, status, created_at')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (fetchError) throw fetchError;
      setIssues(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchIssues();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('user-issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues', filter: `student_id=eq.${userId}` }, (payload) => {
        setIssues((prev) => {
          if (payload.eventType === 'INSERT') return [payload.new, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map((it) => (it.id === payload.new.id ? payload.new : it));
          if (payload.eventType === 'DELETE') return prev.filter((it) => it.id !== payload.old.id);
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>;
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">No issues reported yet</div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const currentIndex = statusSteps.findIndex((s) => s.toLowerCase() === String(issue.status).toLowerCase());
        return (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="p-4 border border-gray-200 rounded-lg bg-white"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{issue.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{new Date(issue.created_at).toLocaleString()}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border text-gray-700">{issue.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {statusSteps.map((label, idx) => (
                <Step key={label} label={label} active={idx === currentIndex} done={idx < currentIndex} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StudentIssueList;


