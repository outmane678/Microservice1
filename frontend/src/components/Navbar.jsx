import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">Microservices</div>
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/employes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Employés
        </NavLink>
        <NavLink to="/departements" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Départements
        </NavLink>
        <button className="nav-link logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
