import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import BrandGuidelines from './pages/BrandGuidelines';
import SubmitContent from './pages/SubmitContent';
import ReviewQueue from './pages/ReviewQueue';
import SubmissionHistory from './pages/SubmissionHistory';
import Login from './pages/Login';
import { getStoredRole, setStoredRole, clearStoredRole } from './services/authService';

export default function App() {
  const [currentRole, setCurrentRole] = useState(() => getStoredRole());

  const handleSelectRole = (role) => {
    setStoredRole(role);
    setCurrentRole(role);
  };

  const handleLogout = () => {
    clearStoredRole();
    setCurrentRole(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route: if already authenticated with a demo role, redirect to Dashboard */}
        <Route
          path="/login"
          element={
            currentRole ? (
              <Navigate to="/" replace />
            ) : (
              <Login onSelectRole={handleSelectRole} />
            )
          }
        />

        {/* Protected Dashboard Workspace Routes: if not authenticated, redirect to /login */}
        <Route
          path="/"
          element={
            currentRole ? (
              <MainLayout
                currentRole={currentRole}
                onRoleChange={handleSelectRole}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="guidelines" element={<BrandGuidelines />} />
          <Route path="submit" element={<SubmitContent />} />
          <Route path="review" element={<ReviewQueue />} />
          <Route path="history" element={<SubmissionHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
