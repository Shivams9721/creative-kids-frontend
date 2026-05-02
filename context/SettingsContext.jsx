"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { safeFetch } from "@/lib/safeFetch";

const DEFAULTS = {
  maintenance_mode: false,
  cod_enabled: true,
  reviews_enabled: true,
  store_name: "Creative Kid's",
  cod_max_value: 1999,
  cod_first_order_max: 999,
  cod_fee: 0,
  cod_phone_verify_required: false,
  cod_pincode_check_enabled: true,
};

const SettingsContext = createContext(DEFAULTS);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

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
