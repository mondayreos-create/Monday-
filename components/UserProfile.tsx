import React, { useState, useEffect } from 'react';
import { useAuth, generateAvatar } from './AuthContext.tsx';

const UserProfile: React.FC = () => {
  const { user, googleUser, logout } = useAuth();
  // Prefer google user if available for display, otherwise license user
  const displayUser = googleUser || user || { name: 'SP Tool', picture: '' };
  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    if (displayUser) {
        setImgSrc(displayUser.picture || generateAvatar(displayUser.name));
    }
  }, [displayUser]);

  const handleLogout = () => {
    logout();
    // Refresh to clear any local states if needed
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <img 
            src={imgSrc} 
            alt={displayUser.name} 
            className="w-9 h-9 rounded-full border-2 border-cyan-400 object-cover"
            onError={(e) => {
                e.currentTarget.onerror = null; 
                setImgSrc(generateAvatar(displayUser.name));
            }}
        />
        <div className="text-left hidden sm:block">
            <span className="font-semibold text-gray-200 text-sm">{displayUser.name}</span>
            <p className="text-[9px] text-cyan-500 uppercase font-black tracking-tighter">Unlimited Access</p>
        </div>
      </div>
      {(googleUser || user) && (
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white bg-gray-700/50 px-3 py-1.5 rounded-md transition-colors duration-200"
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default UserProfile;