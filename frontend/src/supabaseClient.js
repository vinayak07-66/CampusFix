import { createClient } from '@supabase/supabase-js';

import { useState } from "react";
//import { supabase } from "../supabaseClient";
// Supabase configuration
const supabaseUrl = 'https://qtraouezokpbfitgdnec.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cmFvdWV6b2twYmZpdGdkbmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTM1NzUsImV4cCI6MjA2ODc2OTU3NX0.a8ZdlWcIxEXNmWjSFk6HSuGWbMlqVafiIb6VG65AupE';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export default function ReportIssue() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let photoUrl = null;

      // 1. Upload photo if exists
      if (photo) {
        const filePath = `report-${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-uploads") // bucket name
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        // get public url
        const { data } = supabase.storage
          .from("complaint-uploads")
          .getPublicUrl(filePath);

        photoUrl = data.publicUrl;
      }

      // 2. Insert into issues table
      const { error: insertError } = await supabase.from("issues").insert([
        {
          student_id: "test-student-123", // replace with logged-in student id
          title,
          description,
          photo_url: photoUrl,
        },
      ]);

      if (insertError) throw insertError;

      alert("✅ Report submitted successfully!");
      setTitle("");
      setDescription("");
      setPhoto(null);
    } catch (err) {
      console.error("Error:", err.message);
      alert("❌ Failed to submit report. Check console.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-2">
      <input
        type="text"
        placeholder="Issue Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Describe the issue"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button type="submit">Submit Report</button>
    </form>
  );
}

