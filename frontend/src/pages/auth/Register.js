import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../lib/supabaseClient';
import AuthCard from '../../components/AuthCard';
import PasswordInput from '../../components/PasswordInput';

// List of departments for dropdown
const departments = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Sociology',
  'English',
  'History',
  'Philosophy',
  'Political Science',
  'Other',
];

const Register = () => {
  const { register, error, isAuthenticated, setError } = useAuth();
  const navigate = useNavigate();
  // Only keep the loading state since password visibility is handled by PasswordInput component
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Clear any previous errors
    setError(null);
  }, [isAuthenticated, navigate, setError]);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      studentId: '',
      department: '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
        .test('is-pccoer', 'Only @pccoer.in email addresses are allowed', 
          value => value && value.endsWith('@pccoer.in')),
      password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
      studentId: Yup.string()
        .required('Student ID is required')
        .matches(/^[A-Za-z0-9]+$/, 'Student ID must contain only letters and numbers'),
      department: Yup.string()
        .required('Department is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { name, email, password, studentId, department } = values;
        
        // Register with Supabase
        const { error: supabaseError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              student_id: studentId,
              department
            }
          }
        });
        
        if (supabaseError) throw supabaseError;
        
        // Call the register function from context to handle any additional logic
        const success = await register(name, email, password, studentId, department);
        
        if (success) {
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Failed to register. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <AuthCard
      logo={<span className="text-white text-2xl font-bold">CF</span>}
      title="Create an account"
      subtitle="Join CampusFix to report and track campus issues"
      showOverlay={false}
      backgroundImage="/login-bg.jpg"
    >
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50/90 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl mb-4" role="alert" aria-live="polite">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 border rounded-2xl bg-white/70 backdrop-blur placeholder-gray-400 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition duration-300 ${
                  formik.touched.name && formik.errors.name
                    ? 'border-red-300 bg-red-50/80'
                    : 'border-gray-200'
                }`}
                placeholder="Enter your full name"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 border rounded-2xl bg-white/70 backdrop-blur placeholder-gray-400 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition duration-300 ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-300 bg-red-50/80'
                    : 'border-gray-200'
                }`}
                placeholder="Enter your email"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>
            
            {/* Password Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="new-password"
                  placeholder="Enter password"
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  className="bg-white/70 backdrop-blur rounded-2xl"
                />
              </div>
              
              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  error={formik.errors.confirmPassword}
                  touched={formik.touched.confirmPassword}
                  className="bg-white/70 backdrop-blur rounded-2xl"
                />
              </div>
            </div>
            
            {/* Student ID and Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student ID */}
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  value={formik.values.studentId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border rounded-2xl bg-white/70 backdrop-blur placeholder-gray-400 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition duration-300 ${
                    formik.touched.studentId && formik.errors.studentId
                      ? 'border-red-300 bg-red-50/80'
                      : 'border-gray-200'
                  }`}
                  placeholder="Enter student ID"
                />
                {formik.touched.studentId && formik.errors.studentId && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.studentId}</p>
                )}
              </div>
              
              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border rounded-2xl bg-white/70 backdrop-blur focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition duration-300 ${
                    formik.touched.department && formik.errors.department
                      ? 'border-red-300 bg-red-50/80'
                      : 'border-gray-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {formik.touched.department && formik.errors.department && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.department}</p>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 transition-colors duration-300 mt-6 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Register</span>
                </>
              )}
            </button>
          </form>
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-sky-600 hover:text-sky-700 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 rounded-md px-1"
              >
                Login here
              </Link>
            </p>
          </div>
    </AuthCard>
  );
};

export default Register;