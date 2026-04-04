"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { AgeNavigatorBanner } from "@/components/AgeNavigator";

export default function ConditionalShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const showAgeBanner = !isAdmin &&
    (pathname === "/" || pathname?.startsWith("/shop"));

  return (
    <>
      {!isAdmin && <Navbar />}
      {!isAdmin && <CartDrawer />}
      {showAgeBanner && <AgeNavigatorBanner />}
      {children}
      {!isAdmin && <Footer />}
    </>
  );
}
