import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.tsx';
import Devices from './pages/Devices.tsx';
import AlertsPage from './pages/AlertPage.tsx';
import Settings from './pages/Settings.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<Settings />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
