"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { AgeNavigatorBanner } from "@/components/shop/AgeNavigator";
import MaintenanceBanner from "@/components/layout/MaintenanceBanner";

export default function ConditionalShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const showAgeBanner = !isAdmin && (pathname === "/" || pathname?.startsWith("/shop"));

  return (
    <>
      <MaintenanceBanner />
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}
      {showAgeBanner && (
        <div className={pathname === "/" ? "block lg:hidden" : ""}>
          <AgeNavigatorBanner />
        </div>
      )}
      {children}
      {!isAdmin && <Footer />}
    </>
  );
}
