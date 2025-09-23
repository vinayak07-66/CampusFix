import React from 'react';
import { Link } from 'react-router-dom';

const AuthCard = ({ logo, title, subtitle, children, showOverlay = true, backgroundImage = "/login-bg.jpg" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-cover bg-center bg-fixed" 
      style={{ backgroundImage: `url('${backgroundImage}')` }}>
      {/* Background overlay for contrast */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/70 via-sky-900/40 to-transparent" aria-hidden="true"></div>
      )}
      
      {/* Main card container */}
      <div className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] bg-white/85 backdrop-blur-md border border-white/40 relative z-20 mx-4 page-fade">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/" aria-label="Go to home">
            <img src="https://i.ibb.co/WNJMKrDy/College-Logo.jpg" alt="PCCOER Logo" className="w-20 h-20 rounded-full shadow-lg object-contain bg-white p-2" />
          </Link>
        </div>
        
        {/* Title */}
        {title && (
          <h1 className="text-2xl font-semibold text-sky-700 text-center mb-2">
            {title}
          </h1>
        )}
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-center text-gray-600 mb-6 relative">
            <span className="relative z-10">{subtitle}</span>
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-sky-200 rounded-full"></span>
          </p>
        )}
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default AuthCard;