import React, { createContext, useContext, useState, useEffect } from "react";
import { GLOBAL_SERVER_ERROR_EVENT } from "../api.js";

interface GlobalErrorContextType {
  globalError: string | null;
  setGlobalError: (message: string | null) => void;
  clearGlobalError: () => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const GlobalErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalError, setGlobalErrorState] = useState<string | null>(null);

  useEffect(() => {
    const handleServerError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      if (customEvent.detail && customEvent.detail.message) {
        setGlobalErrorState(customEvent.detail.message);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(GLOBAL_SERVER_ERROR_EVENT, handleServerError);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(GLOBAL_SERVER_ERROR_EVENT, handleServerError);
      }
    };
  }, []);

  const setGlobalError = (message: string | null) => {
    setGlobalErrorState(message);
  };

  const clearGlobalError = () => {
    setGlobalErrorState(null);
  };

  return (
    <GlobalErrorContext.Provider
      value={{
        globalError,
        setGlobalError,
        clearGlobalError,
      }}
    >
      {children}
    </GlobalErrorContext.Provider>
  );
};

export function useGlobalError(): GlobalErrorContextType {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error("useGlobalError must be used within a GlobalErrorProvider");
  }
  return context;
}
