import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

const getStatusChipClasses = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Pending':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const StatusDropdown = ({ issueId, status, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);

  const handleSelect = async (nextStatus) => {
    if (nextStatus === status) return;
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('issues')
        .update({ status: nextStatus })
        .eq('id', issueId);
      if (error) throw error;
      toast.success('Status updated');
      onStatusChange?.(nextStatus);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
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


