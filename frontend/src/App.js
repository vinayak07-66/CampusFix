import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
// Remove unused import since supabase is not used in this file


// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Home from './pages/Home';
import EventsList from './pages/events/EventsList';
import EventDetails from './pages/events/EventDetails';
import EventUpdates from './pages/events/EventUpdates';

// Protected Pages - Student
import Dashboard from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import IssuesList from './pages/issues/IssuesList';
import IssueDetails from './pages/issues/IssueDetail';
import CreateIssue from './pages/issues/CreateIssue';
import MyEvents from './pages/events/EventBanner';

// Protected Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/UserManagement';
import ManageIssues from './pages/admin/IssueManagement';
import ManageEvents from './pages/admin/EventManagement';
import CreateEvent from './pages/admin/CreateEvent';
import EditEvent from './pages/admin/EditEvent';

// Error Pages
import NotFound from './pages/NotFound';

const App = () => {
  const { isAuthenticated, user, loading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Protected route component
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Public Routes with Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/event-updates" element={<EventUpdates />} />
      </Route>

      {/* Protected Routes - All Users */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <ProtectedRoute>
              <IssuesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues/create"
          element={
            <ProtectedRoute>
              <CreateIssue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues/:id"
          element={
            <ProtectedRoute>
              <IssueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <MyEvents />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/issues"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ManageIssues />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/create"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <EditEvent />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;