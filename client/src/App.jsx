import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import BrandGuidelines from './pages/BrandGuidelines';
import SubmitContent from './pages/SubmitContent';
import ReviewQueue from './pages/ReviewQueue';
import SubmissionHistory from './pages/SubmissionHistory';

export default function App() {
  const [currentRole, setCurrentRole] = useState('Brand Manager');

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout
              currentRole={currentRole}
              onRoleChange={(role) => setCurrentRole(role)}
            />
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
