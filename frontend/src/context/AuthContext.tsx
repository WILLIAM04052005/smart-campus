import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "../api/client";

export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = "smart-campus-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Au chargement de l'app : si un token est déjà stocké (utilisateur
  // déjà connecté lors d'une session précédente), on vérifie sa validité
  // auprès du backend et on récupère le profil associé.
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    apiRequest<{ user: User }>("/auth/me", { token })
      .then((res) => setUser(res.user))
      .catch(() => {
        // Token expiré ou invalide : on nettoie tout
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  async function login(email: string, password: string) {
    const res = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    persistSession(res);
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const res = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: data,
    });
    persistSession(res);
  }

  function persistSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pratique pour consommer le contexte depuis n'importe quel composant :
// const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  return ctx;
}
