import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeService } from '../api/employeService';
import { departementService } from '../api/departementService';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ employes: 0, departements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([employeService.getAll(), departementService.getAll()])
      .then(([empRes, depRes]) => {
        if (cancelled) return;
        setStats({
          employes: empRes.status === 'fulfilled' ? empRes.value.data.length : 0,
          departements: depRes.status === 'fulfilled' ? depRes.value.data.length : 0,
        });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="welcome-text">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
      </p>

      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <div className="stats-grid">
          <Link to="/employes" className="stat-card">
            <span className="stat-number">{stats.employes}</span>
            <span className="stat-label">Employees</span>
          </Link>
          <Link to="/departements" className="stat-card">
            <span className="stat-number">{stats.departements}</span>
            <span className="stat-label">Departments</span>
          </Link>
        </div>
      )}
    </div>
  );
}
