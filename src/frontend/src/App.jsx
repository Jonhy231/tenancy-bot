import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import Tickets from './pages/Tickets';
import Moderation from './pages/Moderation';
import Logs from './pages/Logs';
import Levels from './pages/Levels';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* We mount the React app inside /dashboard/:guildId to not conflict with the static /dashboard.html */}
        <Route path="/dashboard/:guildId" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="logs" element={<Logs />} />
          <Route path="levels" element={<Levels />} />
          {/* Fallback to Overview */}
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
