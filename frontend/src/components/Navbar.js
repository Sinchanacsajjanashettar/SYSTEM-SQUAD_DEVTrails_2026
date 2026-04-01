import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const workerName = localStorage.getItem('workerName');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-bold text-xl">
        <Shield size={28} /> GigShield AI
      </Link>
      <div className="flex gap-6 items-center">
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
        <Link to="/policy" className="text-gray-600 hover:text-blue-600">My Policy</Link>
        {workerName && (
          <div className="flex items-center gap-4 border-l pl-6">
            <span className="text-sm font-medium text-gray-700">Hi, {workerName}</span>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;