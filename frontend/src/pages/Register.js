import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, MapPin, Wallet, Phone, Briefcase, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '',
    phone: '',
    platform: 'Swiggy', 
    location: 'Bangalore', 
    dailyIncome: 600,
    password: '',
    upiHandle: '',
    bankAccount: '',
    ifscCode: '',
    accountHolder: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.phone || !formData.password || !formData.email) {
      setError("Name, Email, Phone, and Password are required");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use localhost:5000 (same as other components)
      const res = await axios.post('http://localhost:5000/api/workers/register', formData);
      
      // Save all worker data to localStorage for later use
      const worker = res.data.worker; // Backend returns worker inside 'worker' object
      localStorage.setItem('workerId', worker._id);
      localStorage.setItem('workerName', worker.name);
      localStorage.setItem('dailyIncome', worker.dailyIncome);
      localStorage.setItem('location', worker.location);
      localStorage.setItem('platform', worker.platform);
      localStorage.setItem('phone', worker.phone);
      localStorage.setItem('upiHandle', worker.upiHandle || '');
      
      alert(`✅ Registration Successful!\nWorker ID: ${worker._id}`);
      navigate('/dashboard');
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Registration failed. Check if Backend is running.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Join GigShield AI</h2>
            <p className="text-gray-600">Register as a gig worker and get protected against income loss</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg mb-6 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20}/>
              <div>
                <p className="font-semibold text-red-900">Registration Error</p>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-4 text-gray-400" size={18} />
                <input 
                  required 
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="Full Name" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-4 text-gray-400" size={18} />
                <input 
                  required 
                  type="tel"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="Phone Number" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid md:grid-cols-2 gap-4">
              <input 
                required
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" 
                placeholder="Email Address" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />

              <div className="relative">
                <Lock className="absolute left-3 top-4 text-gray-400" size={18} />
                <input 
                  required 
                  type="password" 
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="Create Password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-semibold text-blue-900 mb-3">Work Details</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Briefcase className="absolute left-3 top-4 text-gray-400" size={18} />
                  <select 
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                  >
                    <option value="Swiggy">Swiggy</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Zepto">Zepto</option>
                    <option value="Uber">Uber</option>
                    <option value="Ola">Ola</option>
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-4 text-gray-400" size={18} />
                  <input 
                    required 
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" 
                    placeholder="Location (e.g., Bangalore)" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <Wallet className="absolute left-3 top-4 text-gray-400" size={18} />
                  <input 
                    required
                    type="number" 
                    min="100"
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition" 
                    placeholder="Daily Income (₹)" 
                    value={formData.dailyIncome}
                    onChange={e => setFormData({...formData, dailyIncome: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {/* Banking Details (Optional) */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm font-semibold text-green-900 mb-3">Banking Details (for instant payouts)</p>
              <div className="grid md:grid-cols-2 gap-4">
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition" 
                  placeholder="UPI Handle (optional)"
                  value={formData.upiHandle}
                  onChange={e => setFormData({...formData, upiHandle: e.target.value})}
                />
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition" 
                  placeholder="Bank Account (optional)"
                  value={formData.bankAccount}
                  onChange={e => setFormData({...formData, bankAccount: e.target.value})}
                />
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition" 
                  placeholder="IFSC Code (optional)"
                  value={formData.ifscCode}
                  onChange={e => setFormData({...formData, ifscCode: e.target.value})}
                />
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition" 
                  placeholder="Account Holder Name (optional)"
                  value={formData.accountHolder}
                  onChange={e => setFormData({...formData, accountHolder: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account & Get Protected'}
            </button>
            
            <div className="pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">Already registered?</p>
              <Link to="/login" className="text-blue-600 font-bold hover:underline">Login with Email & Password →</Link>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
          <p className="text-blue-900 text-sm">
            <strong>💡 What happens after registration?</strong><br/>
            After registration, you can log in with your email and password. Create a policy to set up insurance. Claims are auto-approved when environmental triggers are met!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;