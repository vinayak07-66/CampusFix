import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];

const getStatusChipClasses = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Pending':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const StatusDropdown = ({ issueId, status, onStatusChange, isReport = false }) => {
  const [updating, setUpdating] = useState(false);

  const handleSelect = async (nextStatus) => {
    if (nextStatus === status) return;
    if (!issueId) {
      toast.error('Invalid item ID');
      return;
    }
    
    try {
      setUpdating(true);
      
      if (isReport) {
        // Handle report status update in localStorage
        try {
          const storedReportsStr = localStorage.getItem('demo_reports');
          if (!storedReportsStr) {
            throw new Error('No reports found in storage');
          }
          
          const storedReports = JSON.parse(storedReportsStr);
          if (!Array.isArray(storedReports)) {
            throw new Error('Invalid reports data format');
          }
          
          const reportIndex = storedReports.findIndex((report) => report.id === issueId);
          if (reportIndex === -1) {
            throw new Error('Report not found');
          }
          
          const updatedReports = storedReports.map((report) =>
            report.id === issueId
              ? { ...report, status: nextStatus, updated_at: new Date().toISOString() }
              : report
          );
          
          localStorage.setItem('demo_reports', JSON.stringify(updatedReports));
          
          // Dispatch custom event to notify other components
          try {
            window.dispatchEvent(new CustomEvent('demo_reports_updated', {
              detail: { id: issueId, status: nextStatus, type: 'status_update' }
            }));
          } catch (eventErr) {
            console.warn('Failed to dispatch update event:', eventErr);
          }
          
          // Also try to update in Supabase if possible (non-blocking)
          try {
            const { error } = await supabase
              .from('reports')
              .update({ status: nextStatus, updated_at: new Date().toISOString() })
              .eq('id', issueId);
            if (error) {
              console.warn('Supabase update failed, but localStorage updated:', error);
            }
          } catch (supabaseErr) {
            // Non-critical error - localStorage update succeeded
            console.warn('Supabase update skipped:', supabaseErr);
          }
          
          toast.success('Report status updated successfully');
          onStatusChange?.(nextStatus);
        } catch (localErr) {
          console.error('Error updating report in localStorage:', localErr);
          throw new Error(localErr.message || 'Failed to update report status');
        }
      } else {
        // Handle issue status update in Supabase
        try {
          const { error } = await supabase
            .from('issues')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', issueId);
          
          if (error) {
            console.error('Supabase error:', error);
            throw new Error(error.message || 'Failed to update issue status');
          }
          
          toast.success('Issue status updated successfully');
          onStatusChange?.(nextStatus);
        } catch (supabaseErr) {
          console.error('Error updating issue:', supabaseErr);
          throw supabaseErr;
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
      const errorMessage = err?.message || 'Failed to update status. Please try again.';
      toast.error(errorMessage);
      // Don't call onStatusChange on error to keep UI consistent
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={updating}
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-full ${getStatusChipClasses(status)} disabled:opacity-60`}
        >
          {status}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="min-w-[160px] rounded-md border bg-white p-1 shadow-md">
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenu.Item
              key={opt}
              onSelect={() => handleSelect(opt)}
              className={`text-sm px-2 py-1.5 rounded-md cursor-pointer outline-none hover:bg-gray-100 ${
                opt === status ? 'font-semibold' : ''
              }`}
            >
              {opt}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default StatusDropdown;


