import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('invoice_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          logout();
        } else {
          setUser({
            userId: payload.userId || payload.sub,
            email: payload.email,
            role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            name: payload.name || payload.email,
          });
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('invoice_token', data.token);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('invoice_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.some(r => r.toLowerCase() === user.role?.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
