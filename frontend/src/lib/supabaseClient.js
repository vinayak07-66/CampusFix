import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://qtraouezokpbfitgdnec.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cmFvdWV6b2twYmZpdGdkbmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTM1NzUsImV4cCI6MjA2ODc2OTU3NX0.a8ZdlWcIxEXNmWjSFk6HSuGWbMlqVafiIb6VG65AupE';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);