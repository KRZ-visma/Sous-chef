import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import RecipeSubmitPage from './pages/RecipeSubmitPage'
import WeekPlanPage from './pages/WeekPlanPage'

export default function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <span className="brand">Sous-chef</span>
        <nav className="site-nav" aria-label="Main">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Week plan
          </NavLink>
          <NavLink
            to="/submit-recipe"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Add recipe
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<WeekPlanPage />} />
        <Route path="/submit-recipe" element={<RecipeSubmitPage />} />
      </Routes>
    </div>
  )
}
