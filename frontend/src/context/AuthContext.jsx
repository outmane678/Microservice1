import { useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { AuthContext } from './authContextValue';

const hasToken = () => !!localStorage.getItem('token');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasToken);

  useEffect(() => {
    if (!hasToken()) return;
    let cancelled = false;
    const subscription = authService.getProfile()
      .then(({ data }) => { if (!cancelled) setUser(data); })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('token');
          setUser(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; void subscription; };
  }, []);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user ?? data);
    return data;
  };

  const register = async (userData) => {
    const { data } = await authService.register(userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
