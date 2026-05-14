import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import Tickets from './pages/Tickets';
import Moderation from './pages/Moderation';
import Logs from './pages/Logs';
import Levels from './pages/Levels';

import ServerSelector from './pages/ServerSelector';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<ServerSelector />} />
        <Route path="/dashboard/:guildId" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="logs" element={<Logs />} />
          <Route path="levels" element={<Levels />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
