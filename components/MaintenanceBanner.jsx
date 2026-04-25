"use client";
import { useSettings } from "@/context/SettingsContext";
import { usePathname } from "next/navigation";

export default function MaintenanceBanner() {
  const { maintenance_mode } = useSettings();
  const pathname = usePathname();

  // Don't show on admin pages
  if (!maintenance_mode || pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white"/>
        </svg>
      </div>
      <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-3">Under Maintenance</h1>
      <p className="text-[13px] text-black/50 max-w-sm leading-relaxed">
        We're making some improvements to bring you a better experience. We'll be back shortly.
      </p>
      <p className="text-[11px] text-black/30 tracking-widest uppercase mt-6">Creative Kid's</p>
    </div>
  );
}
