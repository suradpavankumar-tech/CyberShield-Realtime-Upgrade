import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "../services/authService";

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";

const TOKEN_KEY = "cybershield_token";
const USER_KEY = "cybershield_user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    payload: LoginRequest,
  ) => Promise<User>;

  register: (
    payload: RegisterRequest,
  ) => Promise<User>;

  logout: () => void;

  refreshUser: () => Promise<User | null>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

interface AuthProviderProps {
  children: ReactNode;
}

function readStoredUser(): User | null {
  try {
    const storedUser =
      localStorage.getItem(USER_KEY);

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function AuthProvider({
  children,
}: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] = useState<User | null>(
    () => readStoredUser(),
  );

  const [loading, setLoading] = useState(
    Boolean(
      localStorage.getItem(TOKEN_KEY),
    ),
  );

  const saveSession = useCallback(
    (
      accessToken: string,
      authenticatedUser: User,
    ) => {
      localStorage.setItem(
        TOKEN_KEY,
        accessToken,
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(authenticatedUser),
      );

      setToken(accessToken);
      setUser(authenticatedUser);
    },
    [],
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  const refreshUser =
    useCallback(async (): Promise<User | null> => {
      const storedToken =
        localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setLoading(false);
        return null;
      }

      try {
        const currentUser =
          await getCurrentUser();

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(currentUser),
        );

        setToken(storedToken);
        setUser(currentUser);

        return currentUser;
      } catch {
        clearSession();
        return null;
      } finally {
        setLoading(false);
      }
    }, [clearSession]);

  useEffect(() => {
    const storedToken =
      localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setLoading(false);
      return;
    }

    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (
      payload: LoginRequest,
    ): Promise<User> => {
      const response =
        await loginRequest(payload);

      saveSession(
        response.access_token,
        response.user,
      );

      return response.user;
    },
    [saveSession],
  );

  const register = useCallback(
    async (
      payload: RegisterRequest,
    ): Promise<User> => {
      const registeredUser =
        await registerRequest(payload);

      return registeredUser;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated:
        Boolean(token) && Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}

export { AuthContext };

export { AuthProvider };