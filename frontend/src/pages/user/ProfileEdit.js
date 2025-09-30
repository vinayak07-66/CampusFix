import React from 'react';
import ProfileEdit from '../../components/user/ProfileEdit';

const ProfileEditPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileEdit />
      </div>
    </div>
  );
};

export default ProfileEditPage;
