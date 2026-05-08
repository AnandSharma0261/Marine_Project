import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    ship?: string | null;
  }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('marine_user');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.token) {
      api
        .get('/auth/me')
        .then((r) => {
          const fresh = { ...r.data, token: user.token } as AuthUser;
          setUser(fresh);
          localStorage.setItem('marine_user', JSON.stringify(fresh));
        })
        .catch(() => {
          // 401 will be handled by interceptor
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<AuthUser>('/auth/login', { email, password });
      localStorage.setItem('marine_token', data.token);
      localStorage.setItem('marine_user', JSON.stringify(data));
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      role?: string;
      ship?: string | null;
    }) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthUser>('/auth/register', payload);
        localStorage.setItem('marine_token', data.token);
        localStorage.setItem('marine_user', JSON.stringify(data));
        setUser(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('marine_token');
    localStorage.removeItem('marine_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
