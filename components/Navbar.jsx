"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Menu, User, X, Plus, Minus, ChevronDown, Play, Heart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import SmartSearch from "@/components/SmartSearch";

const menuData = {
  BABY: {
    boys: ["Onesies & Rompers", "T-Shirts & Sweatshirts", "Shirts", "Bottomwear", "Clothing Sets"],
    girls: ["Onesies & Rompers", "Tops & Tees", "Dresses", "Bottomwear", "Clothing Sets"]
  },
  KIDS: {
    boys: ["T-Shirts", "Shirts", "Jeans", "Trousers & Joggers", "Shorts", "Co-ord Sets", "Sweatshirts", "Rompers"],
    girls: ["Tops & Tees", "Dresses", "Co-ords & Jumpsuits", "Jeans Joggers & Trousers", "Shorts, Skirts & Skorts", "Rompers"]
  }
};

// ANNOUNCEMENT DATA
const ANNOUNCEMENTS = [
  {
    id: 1,
    content: (
      <>
        Discover Our New Summer Collection. 
        {/* REMOVED: underline underline-offset-4 */}
        <Link href="/shop/new" className="ml-2 text-black hover:opacity-60 transition-opacity">
          Shop Now.
        </Link>
      </>
    )
  },
  {
    id: 2,
    content: (
      <>
      On Purchase Above ₹499, Get Free Shipping!
      </>
    )
  },
  {
    id: 3,
    content: (
      <a 
        // Replace 918527910223 with your actual WhatsApp business number (Country Code + Number)
        href="https://wa.me/918527910223?text=Hello%20Creative%20Kids,%20I%20need%20help%20with..." 
        target="_blank" 
        rel="noopener noreferrer"
        // REMOVED: underline underline-offset-4
        className="flex items-center justify-center gap-2 hover:opacity-60 transition-opacity"
      >
        <span className="text-[#25D366] text-[14px]">✆</span> For Product Inquiries, Chat with Us on WhatsApp!
      </a>
    )
  }
];
export default function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Announcement Bar States
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Rotate Announcements automatically
  useEffect(() => {
    if (isPaused || !isAnnouncementVisible) return;
    
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000); // Changes every 4 seconds

    return () => clearInterval(timer);
  }, [isPaused, isAnnouncementVisible]);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem("token"));
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname]);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isNavOpen]);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default true for SSR, updated in effect

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      setHasScrolled(window.scrollY > 10);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // LV-style: transparent navbar at the top of homepage only (desktop only)
  const isHomepage = pathname === "/";
  const isTransparent = isHomepage && isDesktop && !hasScrolled && !isNavOpen && !isSearchOpen;

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-40 flex flex-col transition-all duration-300 ease-in-out ${isTransparent ? 'bg-transparent' : 'bg-white shadow-sm'}`}
      >
        
        {/* ========================================== */}
        {/* DYNAMIC ANNOUNCEMENT BAR                   */}
        {/* ========================================== */}
        <AnimatePresence>
          {isAnnouncementVisible && (!isHomepage || !isDesktop) && (
            <motion.div 
              initial={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-full overflow-hidden flex items-center ${isTransparent ? 'bg-transparent border-transparent' : 'bg-[#fcfcfc] border-b border-black/5'}`}
            >
              <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 h-[40px] flex items-center justify-between">
                
                {/* Play/Pause Toggle (Left) */}
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex items-center justify-center hover:opacity-50 transition-opacity p-2 -ml-2 text-black w-8 h-8"
                  title={isPaused ? "Play Announcements" : "Pause Announcements"}
                >
                  {isPaused ? (
                    <Play size={12} strokeWidth={3} className="fill-black ml-0.5" />
                  ) : (
                    <div className="flex gap-[3px]">
                      <div className="w-[2px] h-[10px] bg-black"></div>
                      <div className="w-[2px] h-[10px] bg-black"></div>
                    </div>
                  )}
                </button>

                {/* Rotating Announcement Text (Center) */}
                <div className="flex-1 flex justify-center items-center text-[10px] md:text-[11px] font-medium tracking-widest uppercase text-black/80 px-4 h-full relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={announcementIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="absolute w-full flex justify-center items-center"
                    >
                      {ANNOUNCEMENTS[announcementIndex].content}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Close Button (Right) */}
                <button 
                  onClick={() => setIsAnnouncementVisible(false)}
                  className="flex items-center justify-center hover:opacity-50 transition-opacity p-2 -mr-2"
                >
                  <X size={14} strokeWidth={2} />
                </button>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN NAVBAR */}
        <div className="h-[64px] md:h-[72px] w-full flex items-center justify-between px-4 md:px-8 max-w-[1600px] mx-auto">

          <div className="flex items-center gap-4 lg:gap-12 h-full">
            <button
              onClick={() => setIsNavOpen(true)}
              className={`lg:hidden flex items-center gap-2 hover:opacity-40 transition-opacity duration-300 ease-in-out ${isTransparent ? 'text-white' : 'text-black'}`}
            >
              <Menu strokeWidth={1} size={28} />
            </button>

            <Link
              href="/"
              aria-label="Creative Kid's"
              className="flex items-center hover:opacity-50 transition-opacity duration-300"
            >
              <img
                src="/images/text-1777092804420.png"
                alt="Creative Kid's"
                className={`h-7 sm:h-8 md:h-10 w-auto object-contain ${isTransparent ? 'invert brightness-0 contrast-200' : ''}`}
                style={isTransparent ? { filter: 'brightness(0) invert(1)' } : undefined}
              />
            </Link>

            <div className="hidden lg:flex items-center gap-8 h-full">
              <Link href="/shop/offers" className={`text-[12px] font-medium tracking-widest uppercase hover:opacity-50 transition-opacity h-full flex items-center ${isTransparent ? 'text-white' : 'text-[#E2889D]'}`}>
                Offers
              </Link>
              <Link href="/shop/new" className={`text-[12px] font-medium tracking-widest uppercase hover:opacity-40 transition-opacity h-full flex items-center ${isTransparent ? 'text-white' : 'text-black'}`}>
                New Arrivals
              </Link>

              {/* BABY DROPDOWN */}
              <div className="group h-full flex items-center relative cursor-pointer">
                <Link href="/shop/baby" className={`text-[12px] font-medium tracking-widest uppercase group-hover:opacity-60 transition-opacity flex items-center gap-1.5 h-full ${isTransparent ? 'text-white' : 'text-black'}`}>
                  BABY <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" strokeWidth={1.5} />
                </Link>

                <div className="absolute top-full left-0 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 cursor-default">
                  <div className="bg-white shadow-2xl border border-black/5 w-[500px] p-8 flex rounded-b-sm">
                    <div className="w-1/2 pr-8 border-r border-black/5">
                      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-black mb-6">
                        Baby Boys
                      </h3>
                      <ul className="flex flex-col gap-4">
                        {menuData.BABY.boys.map((item) => {
                          const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/,/g, '').replace(/ /g, '-');
                          return (
                            <li key={item}>
                              <Link href={`/shop/baby-boy/${itemSlug}`} className="text-[10px] font-medium tracking-widest text-black/50 hover:text-black transition-colors block uppercase">
                                {item}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    <div className="w-1/2 pl-8">
                      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-black mb-6">
                        Baby Girls
                      </h3>
                      <ul className="flex flex-col gap-4">
                        {menuData.BABY.girls.map((item) => {
                          const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/,/g, '').replace(/ /g, '-');
                          return (
                            <li key={item}>
                              <Link href={`/shop/baby-girl/${itemSlug}`} className="text-[10px] font-medium tracking-widest text-black/50 hover:text-black transition-colors block uppercase">
                                {item}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* KIDS DROPDOWN */}
              <div className="group h-full flex items-center relative cursor-pointer">
                <Link href="/shop/kids" className={`text-[12px] font-medium tracking-widest uppercase group-hover:opacity-60 transition-opacity flex items-center gap-1.5 h-full ${isTransparent ? 'text-white' : 'text-black'}`}>
                  KIDS <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" strokeWidth={1.5} />
                </Link>

                <div className="absolute top-full left-0 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 cursor-default">
                  <div className="bg-white shadow-2xl border border-black/5 w-[500px] p-8 flex rounded-b-sm">
                    <div className="w-1/2 pr-8 border-r border-black/5">
                      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-black mb-6">
                        Boys Clothing
                      </h3>
                      <ul className="flex flex-col gap-4">
                        {menuData.KIDS.boys.map((item) => {
                          const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/,/g, '').replace(/ /g, '-');
                          return (
                            <li key={item}>
                              <Link href={`/shop/kids-boy/${itemSlug}`} className="text-[10px] font-medium tracking-widest text-black/50 hover:text-black transition-colors block uppercase">
                                {item}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    <div className="w-1/2 pl-8">
                      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-black mb-6">
                        Girls Clothing
                      </h3>
                      <ul className="flex flex-col gap-4">
                        {menuData.KIDS.girls.map((item) => {
                          const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/,/g, '').replace(/ /g, '-');
                          return (
                            <li key={item}>
                              <Link href={`/shop/kids-girl/${itemSlug}`} className="text-[10px] font-medium tracking-widest text-black/50 hover:text-black transition-colors block uppercase">
                                {item}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className={`flex items-center justify-end gap-5 md:gap-7 ${isTransparent ? 'text-white' : 'text-black'}`}>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <Search size={18} />
              <span className="hidden md:inline text-[11px] font-bold tracking-widest uppercase">Search</span>
            </button>
            <a href="tel:+911244130381" className="hidden xl:block text-[12px] font-medium tracking-widest uppercase hover:opacity-40 transition-opacity duration-300 ease-in-out">
              Call Us
            </a>

            <Link href={isLoggedIn ? "/profile" : "/login"} className="hover:opacity-40 transition-opacity duration-300 ease-in-out">
              <User strokeWidth={1.5} size={22} className={isLoggedIn ? "text-green-600" : ""} />
            </Link>

            <Link href="/wishlist" className="hover:opacity-40 transition-opacity duration-300 ease-in-out hidden sm:block">
              <Heart strokeWidth={1.5} size={20} />
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="hover:opacity-40 transition-opacity duration-300 ease-in-out relative flex items-center"
            >
              <ShoppingBag strokeWidth={1.2} size={22} className="hidden sm:block" />
              <ShoppingBag strokeWidth={1.2} size={24} className="block sm:hidden" />
              {cartCount > 0 && (
                <span className={`absolute -bottom-1 -right-2 text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold ${isTransparent ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* DYNAMIC HEIGHT SPACER — on homepage desktop it's 0 so hero goes behind transparent navbar */}
      <div 
        className={`w-full bg-white relative z-30 transition-all duration-300 ${(isHomepage && isDesktop) ? 'h-0' : isAnnouncementVisible ? 'h-[104px] md:h-[112px]' : 'h-[64px] md:h-[72px]'}`}
      />

      {/* MOBILE SEARCH BAR — always shown on mobile */}
      <div className="block lg:hidden w-full px-4 py-3 bg-white border-b border-black/10">
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 border border-black/20 rounded-full px-5 py-2.5 hover:border-black transition-colors duration-300 cursor-text"
        >
          <Search size={16} className="text-black/50" />
          <span className="w-full text-[14px] font-light text-black/50">
            Search for "Gifts for Kids"
          </span>
        </div>
      </div>

      {/* MOBILE MEGA MENU */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className="fixed top-0 left-0 h-full w-full max-w-[450px] bg-white shadow-2xl z-[70] flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center px-6 py-5 border-b border-black/10 flex-shrink-0">
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="p-1 -ml-1 hover:rotate-90 hover:opacity-50 transition-all duration-300 ease-in-out text-black"
                >
                  <X strokeWidth={1} size={32} />
                </button>
                <Link
                  href="/"
                  aria-label="Creative Kid's"
                  className="md:hidden flex items-center hover:opacity-50 transition-opacity duration-300"
                >
                  <img
                    src="/images/text-1777092804420.png"
                    alt="Creative Kid's"
                    className="h-7 sm:h-8 w-auto object-contain"
                  />
                </Link>

                <Link href={isLoggedIn ? "/profile" : "/login"} className="md:hidden text-black hover:opacity-50">
                  <User strokeWidth={1.5} size={24} className={isLoggedIn ? "text-green-600" : ""} />
                </Link>
              </div>

              <div className="flex-1 pt-2 pb-6 px-6 flex flex-col">
                <Link href="/shop/new" className="w-full py-5 border-b border-black/10 flex items-center group gap-3">
                  <span className="w-[2px] h-[14px] bg-black"></span>
                  <span className="text-[14px] font-bold tracking-[0.1em] text-black group-hover:opacity-40 transition-opacity duration-300 ease-in-out uppercase">
                    New Arrivals
                  </span>
                </Link>

                <Link href="/shop/offers" className="w-full py-5 border-b border-black/10 flex items-center group gap-3">
                  <span className="w-[2px] h-[14px] bg-[#E2889D]"></span>
                  <span className="text-[14px] font-bold tracking-[0.1em] text-[#E2889D] group-hover:opacity-40 transition-opacity duration-300 ease-in-out uppercase">
                    Offers
                  </span>
                </Link>

                {Object.keys(menuData).map((category) => (
                  <div key={category} className="border-b border-black/10 py-5">
                    <button
                      onClick={() => toggleSection(category)}
                      className="w-full flex justify-between items-center group"
                    >
                      <span className="text-[14px] font-bold tracking-[0.1em] text-black group-hover:opacity-40 transition-opacity duration-300 ease-in-out uppercase">
                        {category}
                      </span>
                      <span className="text-black/40 group-hover:text-black transition-colors duration-300 ease-in-out">
                        {expandedSection === category ? <Minus strokeWidth={1} size={22} /> : <Plus strokeWidth={1} size={22} />}
                      </span>
                    </button>

                    <AnimatePresence>
                      {expandedSection === category && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-6 pb-2 flex flex-col gap-8">

                            <div>
                              <h3 className="text-[12px] font-bold tracking-widest uppercase text-[#4A90E2] mb-4 flex items-center gap-3">
                                <span className="w-[2px] h-[14px] bg-[#4A90E2]"></span> {category === 'BABY' ? 'BABY BOYS' : 'BOYS CLOTHING'}
                              </h3>
                              <ul className="flex flex-col gap-4">
                                {menuData[category].boys.map((item) => {
                                  const categorySlug = `${category.toLowerCase()}-boy`;
                                  const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/,/g, '').replace(/ /g, '-');

                                  return (
                                    <li key={item}>
                                      <Link
                                        href={`/shop/${categorySlug}/${itemSlug}`}
                                        className="text-[11px] font-medium tracking-widest text-black/70 hover:text-black transition-colors block uppercase"
                                      >
                                        {item}
                                      </Link>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>

                            <div>
                              <h3 className="text-[12px] font-bold tracking-widest uppercase text-[#E2889D] mb-4 flex items-center gap-3 mt-4">
                                <span className="w-[2px] h-[14px] bg-[#E2889D]"></span> {category === 'BABY' ? 'BABY GIRLS' : 'GIRLS CLOTHING'}
                              </h3>
                              <ul className="flex flex-col gap-4">
                                {menuData[category].girls.map((item) => {
                                  const categorySlug = `${category.toLowerCase()}-girl`;
                                  const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/,/g, '').replace(/ /g, '-');

                                  return (
                                    <li key={item}>
                                      <Link
                                        href={`/shop/${categorySlug}/${itemSlug}`}
                                        className="text-[11px] font-medium tracking-widest text-black/70 hover:text-black transition-colors block uppercase"
                                      >
                                        {item}
                                      </Link>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-gray-50 flex flex-col gap-2 border-t border-black/10 mt-auto flex-shrink-0">
                <h4 className="text-[11px] font-bold tracking-widest uppercase text-black mb-2">
                  Creative Impression
                </h4>
                <p className="text-[11px] tracking-wider text-black/60 leading-relaxed uppercase">
                  Plot NO.-550A, Sector-37<br />
                  Pace City-II, Gurugram<br />
                  Haryana 122001
                </p>
                <a
                  href="tel:+911244130381"
                  className="text-[12px] font-bold tracking-widest uppercase text-black hover:opacity-50 transition-opacity mt-4 inline-block"
                >
                  Call: +911244130381
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SmartSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
