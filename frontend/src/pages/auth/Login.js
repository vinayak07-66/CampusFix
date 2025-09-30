import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AuthCard from '../../components/AuthCard';
import PasswordInput from '../../components/PasswordInput';

const Login = () => {
  const { login, error, isAuthenticated, setError, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const role = (user?.role || '').toLowerCase();
      if (role === 'admin' || role === 'staff') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
    
    // Clear any previous errors
    setError(null);
  }, [isAuthenticated, navigate, setError]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
        .test('is-pccoer', 'Only Pccoer email addresses are allowed', 
          value => value && value.endsWith('@pccoer.in')),
      password: Yup.string()
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      const success = await login(values.email, values.password);
      setLoading(false);
      
      if (success) {
        const role = (user?.role || '').toLowerCase();
        if (role === 'admin' || role === 'staff') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    },
  });

  return (
    <AuthCard
      logo={<span className="text-white text-2xl font-bold">CF</span>}
      title="CampusFix Login"
      subtitle="Use your email and password to login"
      showOverlay={false}
      backgroundImage="/login-bg.jpg"
    >
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50/90 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl mb-4" role="alert">
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
            {/* Email Field */}
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
                className={`w-full px-4 py-3 border rounded-2xl bg-white/70 backdrop-blur placeholder-gray-400 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-300 hover:shadow-md ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-300 bg-red-50/80'
                    : 'border-gray-200 hover:border-sky-300'
                }`}
                placeholder="Enter your email"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>
            
            {/* Password Field */}
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
                autoComplete="current-password"
                placeholder="Enter your password"
                error={formik.errors.password}
                touched={formik.touched.password}
                className="bg-white/70 backdrop-blur rounded-2xl"
              />
            </div>
            
            {/* Remember me checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded-md"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-sky-600 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 rounded-md px-1">
                  Forgot password?
                </a>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 transition-colors duration-300 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
          
          {/* Register link with enhanced styling */}
          <div className="mt-8 text-center">
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white/80 backdrop-blur text-sm text-gray-500 rounded-full">Or</span>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-sky-600 hover:text-sky-700 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 rounded-md px-1"
              >
                Register here
              </Link>
            </p>
          </div>
    </AuthCard>
  );
};

export default Login;