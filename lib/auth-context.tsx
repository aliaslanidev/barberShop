"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  fetchMe,
  ApiError,
  type BackendRole,
} from "@/lib/api";
import {
  setMockSession,
  getMockSession,
  clearMockSession,
  STORAGE_KEY,
  SESSION_CLEARED_EVENT,
  type MockRole,
} from "@/lib/data/mock-session";

function toSessionRole(role: BackendRole): MockRole | null {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "BARBER":
      return "barber";
    case "CUSTOMER":
      return "customer";
    case "MANAGER":
      return "manager";
    default:
      return null;
  }
}

interface AuthUser {
  id: string;
  name: string;
  role: MockRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (mobile: string, password: string) => Promise<AuthUser>;
  register: (name: string, mobile: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // روی هر لود صفحه، اگه توکن ذخیره‌شده داریم، با /auth/me اعتبارش رو چک می‌کنیم
  useEffect(() => {
    const session = getMockSession();
    if (!session?.token) {
      setIsLoading(false);
      return;
    }
    fetchMe(session.token)
      .then((me) => {
        const role = toSessionRole(me.role);
        if (!role) {
          clearMockSession();
          setUser(null);
          return;
        }
        setUser({ id: me.id, name: me.name, role });
      })
      .catch(() => {
        // توکن منقضی/نامعتبر
        clearMockSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // هر جای پروژه که مستقیم clearMockSession() صدا زده بشه (سایدبار، layoutها، ...)
  // یا تو یه تب دیگه از حساب خارج بشه، state این‌جا هم خالی می‌شه.
  useEffect(() => {
    function handleCleared() {
      setUser(null);
    }
    function handleStorage(e: StorageEvent) {
      // key === null یعنی کل localStorage پاک شده
      if ((e.key === STORAGE_KEY || e.key === null) && !e.newValue) {
        setUser(null);
      }
    }
    window.addEventListener(SESSION_CLEARED_EVENT, handleCleared);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SESSION_CLEARED_EVENT, handleCleared);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function login(mobile: string, password: string) {
    const res = await apiLogin(mobile, password);
    const role = toSessionRole(res.user.role);
    if (!role) {
      throw new ApiError(400, "این نقش هنوز تو فرانت پشتیبانی نمی‌شه");
    }
    setMockSession({ role, id: res.user.id, name: res.user.name, token: res.token });
    const authUser: AuthUser = { id: res.user.id, name: res.user.name, role };
    setUser(authUser);
    return authUser;
  }

  async function register(name: string, mobile: string, password: string) {
    const res = await apiRegister(name, mobile, password);
    // طبق قانون پروژه، ثبت‌نام عمومی همیشه CUSTOMER می‌سازه
    const role = toSessionRole(res.user.role) ?? "customer";
    setMockSession({ role, id: res.user.id, name: res.user.name, token: res.token });
    const authUser: AuthUser = { id: res.user.id, name: res.user.name, role };
    setUser(authUser);
    return authUser;
  }

  function logout() {
    clearMockSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth باید داخل AuthProvider استفاده بشه");
  return ctx;
}