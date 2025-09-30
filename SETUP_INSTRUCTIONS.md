# CampusFix - Campus Issue Reporting System

A comprehensive React-based campus issue reporting system with Supabase backend, featuring photo uploads, role-based authentication, and real-time status tracking.

## Features

### Student Features
- ✅ Submit reports with photos (image upload)
- ✅ Track report status (pending/in-progress/resolved)
- ✅ Edit profile with photo upload
- ✅ View campus events
- ✅ Real-time status updates

### Admin Features
- ✅ View and manage all student reports
- ✅ Update report status
- ✅ Create and manage events
- ✅ User management
- ✅ Advanced filtering and search

### Technical Features
- ✅ Supabase authentication
- ✅ Row Level Security (RLS) policies
- ✅ File upload to Supabase Storage
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Photo preview and management

## Database Setup

### 1. Run the SQL Schema

Execute the SQL commands in `database_setup.sql` in your Supabase SQL editor:

```sql
-- This will create:
-- - users table with RLS policies
-- - reports table with RLS policies  
-- - events table with RLS policies
-- - Storage bucket 'report-photos'
-- - All necessary triggers and functions
```

### 2. Storage Bucket Setup

The SQL script automatically creates the `report-photos` bucket, but you may need to:

1. Go to Storage in your Supabase dashboard
2. Verify the `report-photos` bucket exists
3. Set it to public if you want direct access to images
4. Configure CORS if needed for your domain

### 3. Authentication Setup

1. Go to Authentication > Settings in Supabase
2. Configure your site URL (e.g., `http://localhost:3000`)
3. Add redirect URLs for your domains
4. Enable email confirmation if desired

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the frontend directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server

```bash
npm start
```

## Component Structure

### Student Components
- `ReportForm` - Submit reports with photo upload
- `ReportList` - View and track report status
- `ProfileEdit` - Edit profile with photo upload
- `EventList` - View campus events

### Admin Components
- `ReportManagement` - Manage all reports with filtering
- `EventManagement` - Create and manage events

### Pages
- `/reports/create` - Submit new report
- `/reports` - View my reports
- `/profile/edit` - Edit profile
- `/events-list` - View events
- `/admin/reports` - Admin report management
- `/admin/events-management` - Admin event management

## API Integration

### Supabase Client Setup
The app uses the existing Supabase client configuration in `frontend/src/lib/supabaseClient.js`.

### Key Functions

#### Report Management
```javascript
// Create report
const { data, error } = await supabase
  .from('reports')
  .insert({
    student_id: user.id,
    title: formData.title,
    description: formData.description,
    photo_url: photoUrl,
    status: 'pending'
  });

// Update report status
const { error } = await supabase
  .from('reports')
  .update({ status: newStatus })
  .eq('id', issuesid);
```

#### File Upload
```javascript
// Upload photo to Supabase Storage
const { data, error } = await supabase.storage
  .from('report-photos')
  .upload(fileName, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('report-photos')
  .getPublicUrl(fileName);
```

## Security Features

### Row Level Security (RLS)
- Students can only view/edit their own reports
- Admins can view/edit all reports
- Events are publicly readable
- Only admins can manage events

### File Upload Security
- File type validation (images only)
- File size limits (5MB)
- Secure file naming with user IDs
- Automatic cleanup on user deletion

## Usage Guide

### For Students

1. **Submit a Report**
   - Navigate to `/reports/create`
   - Fill in title and description
   - Upload photo (optional)
   - Submit report

2. **Track Reports**
   - Go to `/reports` to see all your reports
   - View status updates in real-time
   - See submission and update timestamps

3. **Edit Profile**
   - Navigate to `/profile/edit`
   - Update personal information
   - Upload profile photo

4. **View Events**
   - Go to `/events-list`
   - See upcoming and past events
   - Filter by date

### For Admins

1. **Manage Reports**
   - Navigate to `/admin/reports`
   - View all student reports
   - Filter by status or search
   - Update report status

2. **Manage Events**
   - Go to `/admin/events-management`
   - Create new events
   - Edit existing events
   - Delete events

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check storage bucket permissions
   - Verify file size limits
   - Check CORS settings

2. **Authentication Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure user has correct role

3. **Database Errors**
   - Run the complete SQL schema
   - Check table relationships
   - Verify RLS policies are enabled

### Development Tips

1. **Testing File Uploads**
   - Use small test images
   - Check browser console for errors
   - Verify storage bucket exists

2. **Database Debugging**
   - Use Supabase dashboard to inspect data
   - Check RLS policies in SQL editor
   - Monitor authentication logs

## Production Deployment

### Environment Setup
1. Update Supabase URLs for production
2. Configure production storage bucket
3. Set up proper CORS policies
4. Configure authentication domains

### Security Checklist
- [ ] RLS policies are properly configured
- [ ] Storage bucket permissions are correct
- [ ] Authentication is properly set up
- [ ] File upload limits are appropriate
- [ ] CORS is configured for your domain

## Support

For issues or questions:
1. Check the Supabase documentation
2. Review the component code for examples
3. Check browser console for errors
4. Verify database setup with SQL schema

## License

This project is part of the CampusFix system and follows the same licensing terms.
