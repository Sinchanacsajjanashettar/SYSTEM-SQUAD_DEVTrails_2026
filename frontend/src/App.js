import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard_new';
import DashboardAnalytics from './pages/Dashboard_Analytics';
import AdminFraudDashboard from './pages/AdminFraudDashboard';
import Policy from './pages/Policy';

function App() {
  // Simple check for "logged in" state (can be replaced with JWT logic)
  const isAuthenticated = !!localStorage.getItem('workerId');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={isAuthenticated ? <DashboardAnalytics /> : <Navigate to="/login" />} />
          <Route path="/dashboard-v1" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/admin-fraud" element={isAuthenticated ? <AdminFraudDashboard /> : <Navigate to="/login" />} />
          <Route path="/policy" element={isAuthenticated ? <Policy /> : <Navigate to="/login" />} />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/register" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;