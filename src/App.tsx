import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { NearbyPage } from '@/pages/NearbyPage';
import { RoutesPage } from '@/pages/RoutesPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { PlannerPage } from '@/pages/PlannerPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <main className="app-content">
          <Routes>
            <Route path="/" element={<NearbyPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/planner" element={<PlannerPage />} />
          </Routes>
        </main>

        <nav className="tab-bar" aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`} end>
            <span className="tab-icon">&#x1F4CD;</span>
            <span className="tab-label">Nearby</span>
          </NavLink>
          <NavLink to="/routes" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            <span className="tab-icon">&#x2B50;</span>
            <span className="tab-label">Routes</span>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            <span className="tab-icon">&#x26A0;</span>
            <span className="tab-label">Alerts</span>
          </NavLink>
          <NavLink to="/planner" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            <span className="tab-icon">&#x1F5FA;</span>
            <span className="tab-label">Plan</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}
