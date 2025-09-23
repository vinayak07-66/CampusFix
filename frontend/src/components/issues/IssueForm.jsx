import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

const IssueForm = ({ studentId, onSubmitted }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    try {
      setSubmitting(true);
      let imageUrl = '';
      if (file) {
        const ext = file.name.split('.').pop();
        const name = `${studentId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('issues').upload(`images/${name}`, file);
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from('issues').getPublicUrl(`images/${name}`);
        imageUrl = pub.publicUrl;
      }
      const { error } = await supabase.from('issues').insert([
        {
          student_id: studentId,
          title,
          description,
          image_url: imageUrl,
          status: 'Pending',
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      toast.success('Issue submitted');
      setTitle('');
      setDescription('');
      setFile(null);
      setPreview(null);
      onSubmitted?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview && <img alt="preview" src={preview} className="h-28 mt-2 rounded-md border object-cover" />}
      </div>
      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Issue'}
        </button>
      </div>
    </form>
  );
};

export default IssueForm;


