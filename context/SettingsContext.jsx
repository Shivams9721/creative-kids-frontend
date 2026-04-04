"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { safeFetch } from "@/lib/safeFetch";

const SettingsContext = createContext({
  maintenance_mode: false,
  cod_enabled: true,
  reviews_enabled: true,
  store_name: "Creative Kids",
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    cod_enabled: true,
    reviews_enabled: true,
    store_name: "Creative Kids",
  });

  useEffect(() => {
    safeFetch("/api/settings")
      .then(r => r.json())
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
