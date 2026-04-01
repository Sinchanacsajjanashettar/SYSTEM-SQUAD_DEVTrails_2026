import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, Key, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Login with email and password
      const res = await axios.post('http://localhost:5000/api/workers/login', { email, password });
      
      // Extract worker data (backend returns nested structure)
      const worker = res.data.worker || res.data;
      
      if (worker) {
        // Save worker data to localStorage
        localStorage.setItem('workerId', worker._id);
        localStorage.setItem('workerName', worker.name);
        localStorage.setItem('dailyIncome', worker.dailyIncome);
        localStorage.setItem('location', worker.location);
        localStorage.setItem('platform', worker.platform);
        localStorage.setItem('phone', worker.phone);
        
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response?.status === 404) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'ECONNREFUSED') {
        setError("❌ Backend server is not running on localhost:5000");
      } else {
        setError(err.response?.data?.message || "Login failed. Please check your phone number.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <Shield className="text-blue-600" size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-blue-600">GigShield AI</h2>
            <p className="text-gray-600 mt-2 text-center font-medium">Secure your earnings against the elements</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg mb-6 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20}/>
              <p className="text-red-900 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <Key className="absolute left-3 top-4 text-gray-400" size={20} />
              <input 
                required 
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="Enter Your Email" 
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError(''); // Clear error when user types
                }}
                disabled={loading}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-4 text-gray-400" size={20} />
              <input 
                required 
                type="password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="Enter Your Password" 
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError(''); // Clear error when user types
                }}
                disabled={loading}
              />
            </div>
            
            <button 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center gap-2 ${
                loading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
              }`}
            >
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600 mb-2">New delivery partner?</p>
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Create an Account →
            </Link>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
          <p className="text-blue-900 text-sm">
            <strong>📝 How to login:</strong><br/>
            1. Register as a new worker to get your Email & Password<br/>
            2. Enter your Email & Password here to access your dashboard<br/>
            3. Create a policy to start protection
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;