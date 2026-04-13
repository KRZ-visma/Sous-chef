import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import SettingsPage from './pages/SettingsPage'
import WeekPlanPage from './pages/WeekPlanPage'
import './App.css'

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <nav className="app-nav" aria-label="Main">
            <NavLink className="app-nav__link" to="/" end>
              Week plan
            </NavLink>
            <NavLink className="app-nav__link" to="/settings">
              Settings
            </NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<WeekPlanPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
