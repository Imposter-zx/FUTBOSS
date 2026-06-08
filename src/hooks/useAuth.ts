"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useCallback } from "react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
  } | null;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginLoading: boolean;
  registerLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const authState: AuthState = {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          role: (session.user as { role?: string }).role ?? "USER",
        }
      : null,
  };

  const login = useCallback(async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setRegisterLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message ?? "Registration failed",
        };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setRegisterLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    loginLoading,
    registerLoading,
  };
}

export default useAuth;
