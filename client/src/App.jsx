import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SeatMapPage } from './pages/SeatMapPage';
import { AuthModal } from './components/AuthModal';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <BrowserRouter>
      <AuthModal />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/show/:showId" element={<SeatMapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
