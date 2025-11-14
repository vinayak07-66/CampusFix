import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize auth state from Supabase session
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      
      // Check for active session
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const { user: authUser } = data.session;
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || '',
          studentId: authUser.user_metadata?.studentId || '',
          department: authUser.user_metadata?.department || '',
          role: authUser.user_metadata?.role || 'student'
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { user: authUser } = session;
          setUser({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || '',
            studentId: authUser.user_metadata?.studentId || '',
            department: authUser.user_metadata?.department || '',
            role: authUser.user_metadata?.role || 'student'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const { user: authUser } = data.session;
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || '',
          studentId: authUser.user_metadata?.studentId || '',
          department: authUser.user_metadata?.department || '',
          role: authUser.user_metadata?.role || 'student'
        });
        setLoading(false);
        return true;
      } else {
        setUser(null);
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Auth check error:', err.message);
      setUser(null);
      setLoading(false);
      return false;
    }
  }, []);

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      const normalizedUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
        studentId: data.user.user_metadata?.studentId || '',
        department: data.user.user_metadata?.department || '',
        role: data.user.user_metadata?.role || 'student'
      };
      
      setUser(normalizedUser);
      
      setLoading(false);
      return { success: true, user: normalizedUser };
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      return { success: false, error: err };
    }
  };

  // Register user
  const register = async (name, email, password, studentId, department) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            studentId,
            department,
            role: 'student'
          }
        }
      });
      
      if (error) throw error;
      
      // Note: Supabase might require email verification depending on settings
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          studentId: data.user.user_metadata?.studentId || '',
          department: data.user.user_metadata?.department || '',
          role: data.user.user_metadata?.role || 'student'
        });

        // Ensure a profiles row exists
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          email,
          department,
        }, { onConflict: 'id' });
      }
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // 1) Update auth metadata
      const { data, error } = await supabase.auth.updateUser({
        data: userData
      });
      if (error) throw error;

      // 2) Upsert into profiles table for app-wide visibility
      const currentUser = data.user;
      const upsertPayload = {
        id: currentUser.id,
        full_name: userData.name ?? currentUser.user_metadata?.name ?? '',
        email: currentUser.email,
        department: userData.department ?? currentUser.user_metadata?.department ?? null,
        profile_image: userData.profileImage ?? null,
        updated_at: new Date().toISOString()
      };
      await supabase.from('profiles').upsert(upsertPayload, { onConflict: 'id' });
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || '',
          studentId: data.user.user_metadata?.studentId || '',
          department: data.user.user_metadata?.department || '',
          role: data.user.user_metadata?.role || 'student'
        });
      }
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      setLoading(false);
      return false;
    }
  };

  // Change password
  const changePassword = async (newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Password change failed');
      setLoading(false);
      return false;
    }
  };

  // Reset password (sends reset email)
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Password reset request failed');
      setLoading(false);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    resetPassword,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
