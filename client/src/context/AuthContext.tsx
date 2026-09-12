import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser } from "../types/index.js";
import { loginApi, logoutApi, getMeApi, changePasswordApi, setAuthToken, getAuthToken } from "../api.js";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser; mustChangePassword?: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from token on mount
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const existingToken = getAuthToken();
      if (!existingToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const profile = await getMeApi();
        if (isMounted) {
          setUser(profile);
          setTokenState(existingToken);
          // Sync with RequesterContext if requester
          if (profile.role === "REQUESTER") {
            try {
              localStorage.setItem(
                "toktickit_selected_requester",
                JSON.stringify({
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                  isActive: true,
                })
              );
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        console.warn("Session restore failed, clearing token", err);
        setAuthToken(null);
        if (isMounted) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();

    const handleUnauthorized = () => {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    };
    window.addEventListener("toktickit:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("toktickit:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginApi({ email, password });
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);

      // Sync with RequesterContext for Lab 2 backwards compatibility
      if (data.user.role === "REQUESTER") {
        try {
          localStorage.setItem(
            "toktickit_selected_requester",
            JSON.stringify({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              isActive: true,
            })
          );
        } catch (e) {
          console.error(e);
        }
      }

      return {
        success: true,
        user: data.user,
        mustChangePassword: data.user.mustChangePassword,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to sign in. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn("Logout API warning:", e);
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      try {
        localStorage.removeItem("toktickit_selected_requester");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const changePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const res = await changePasswordApi(payload);
      if (res.token) {
        setAuthToken(res.token);
        setTokenState(res.token);
      }
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update password." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({ success: false, error: "AuthProvider not found" }),
      logout: async () => {},
      changePassword: async () => ({ success: false, error: "AuthProvider not found" }),
    };
  }
  return context;
}
