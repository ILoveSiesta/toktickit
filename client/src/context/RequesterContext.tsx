import React, { createContext, useContext, useState, useEffect } from "react";
import { RequesterUser } from "../types/index.js";

interface RequesterContextType {
  currentRequester: RequesterUser | null;
  selectRequester: (requester: RequesterUser) => void;
  clearRequester: () => void;
  isLoading: boolean;
}

const STORAGE_KEY = "toktickit_selected_requester";

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRequester, setCurrentRequester] = useState<RequesterUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.isActive) {
          setCurrentRequester(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load requester from localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRequester = (requester: RequesterUser) => {
    setCurrentRequester(requester);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
    } catch (e) {
      console.error("Failed to save requester to localStorage", e);
    }
  };

  const clearRequester = () => {
    setCurrentRequester(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove requester from localStorage", e);
    }
  };

  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        selectRequester,
        clearRequester,
        isLoading,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
};

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
