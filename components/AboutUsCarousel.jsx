"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  SquiggleUnderline,
  Floating,
  HideAndSeek,
  AnimatedSparkle,
  AnimatedCloud,
  AnimatedStar,
  AnimatedFlower,
  AnimatedLeaf,
  Cloud,
  Star,
  Heart as DecoHeart,
  Flower,
  Bird,
  Balloon,
  Butterfly,
  Rainbow,
  Bunny,
} from "@/components/decorations";

function HeaderDog({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="100" rx="36" ry="8" fill="rgba(0,0,0,0.06)" />
      <path d="M22 70 Q22 50 42 50 L78 50 Q100 50 100 72 L100 92 L22 92 Z" fill="#D9A574" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <rect x="30" y="82" width="8" height="14" fill="#D9A574" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <rect x="58" y="82" width="8" height="14" fill="#D9A574" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <rect x="84" y="82" width="8" height="14" fill="#D9A574" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <circle cx="32" cy="42" r="20" fill="#E8B987" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <path d="M16 32 Q10 24 18 22 L24 36 Z" fill="#B8814F" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
      <path d="M44 30 Q50 22 42 20 L36 34 Z" fill="#B8814F" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
      <circle cx="26" cy="42" r="2" fill="#222" />
      <circle cx="38" cy="42" r="2" fill="#222" />
      <ellipse cx="32" cy="50" rx="3" ry="2" fill="#222" />
      <path d="M32 52 Q32 56 28 56" stroke="#222" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M100 70 Q112 64 108 56" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="#D9A574" />
    </svg>
  );
}

function Ship({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M15 70 L85 70 L75 85 L25 85 Z" fill="#C99A6A" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
      <rect x="48" y="22" width="2.5" height="48" fill="#6B4226" />
      <path d="M50 24 L72 56 L50 56 Z" fill="#F4D6B0" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      <path d="M50 30 L30 58 L50 58 Z" fill="#FFFFFF" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      <circle cx="50" cy="20" r="2.5" fill="#E2889D" />
    </svg>
  );
}

function Anchor({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="14" r="5" fill="none" stroke="#6B4226" strokeWidth="2.5" />
      <path d="M32 19 V52" stroke="#6B4226" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 30 H42" stroke="#6B4226" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 44 Q14 56 32 56 Q50 56 50 44" stroke="#6B4226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Compass({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="28" fill="#FFF7E6" stroke="#6B4226" strokeWidth="2" />
      <circle cx="36" cy="36" r="22" fill="none" stroke="rgba(107,66,38,0.3)" strokeWidth="1" />
      <path d="M36 14 L40 36 L36 58 L32 36 Z" fill="#E2889D" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
      <path d="M14 36 L36 32 L58 36 L36 40 Z" fill="#F0B95B" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
      <circle cx="36" cy="36" r="2.5" fill="#6B4226" />
    </svg>
  );
}

function Wave({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 1200 60" preserveAspectRatio="none" width="100%" height="40">
      <path d="M0,30 Q150,5 300,30 T600,30 T900,30 T1200,30 V60 H0 Z" fill="#BDD9E8" opacity="0.6" />
      <path d="M0,40 Q150,15 300,40 T600,40 T900,40 T1200,40 V60 H0 Z" fill="#BDD9E8" opacity="0.4" />
    </svg>
  );
}

const SLIDES = [
  {
    key: "welcome",
    eyebrow: "About Us",
    title: "Welcome Aboard",
    body: "Ahoy, young adventurers and parents alike! Welcome to our colourful corner of the web where style meets smiles and every outfit tells a tale of fun and discovery.",
    bg: "#FFF6EE",
    accent: "#E2889D",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={4} amplitude={6} className="absolute top-[18%] left-[35%]"><Ship size={120} /></Floating>
        <div className="absolute top-[10%] left-[12%]"><AnimatedCloud size={48} /></div>
        <div className="absolute top-[18%] right-[14%]"><AnimatedCloud size={36} /></div>
        <div className="absolute top-[6%] right-[36%]"><AnimatedStar size={14} color="#F0B95B" /></div>
        <Wave className="absolute bottom-0 left-0" />
      </div>
    ),
  },
  {
    key: "journey",
    eyebrow: "Our Journey",
    title: "Where It All Began",
    body: "We set sail with a simple idea: clothing as vibrant and unique as the imaginations of the little ones who wear them. From the first stitch to each season's collection, we craft pieces that spark creativity and celebrate the magic of childhood.",
    bg: "#FDEEF1",
    accent: "#E2889D",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={3.6} amplitude={5} className="absolute top-[28%] left-[30%]"><Compass size={96} /></Floating>
        <div className="absolute top-[12%] left-[14%]"><AnimatedSparkle size={14} color="#E2889D" /></div>
        <div className="absolute top-[22%] right-[16%]"><AnimatedFlower size={26} petal="#E2889D" /></div>
        <div className="absolute bottom-[18%] right-[24%]"><AnimatedStar size={12} color="#F0B95B" /></div>
        <div className="absolute bottom-[12%] left-[20%]"><AnimatedLeaf size={16} color="#B8C9A8" /></div>
      </div>
    ),
  },
  {
    key: "mission",
    eyebrow: "Our Mission",
    title: "Smooth Sailing for Parents",
    body: "At the heart of our mission is you — our crew of awesome parents and guardians. We're here to make shopping smooth sailing, offering not just adorable threads but also peace of mind with top-notch quality and service.",
    bg: "#EAF3F9",
    accent: "#BDD9E8",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={3.8} amplitude={6} className="absolute top-[26%] left-[36%]"><Anchor size={88} /></Floating>
        <div className="absolute top-[10%] left-[18%]"><AnimatedCloud size={42} /></div>
        <div className="absolute top-[14%] right-[12%]"><AnimatedCloud size={36} /></div>
        <div className="absolute bottom-[20%] left-[14%]"><AnimatedStar size={14} color="#BDD9E8" /></div>
        <Wave className="absolute bottom-0 left-0" />
      </div>
    ),
  },
  {
    key: "apart",
    eyebrow: "What Sets Us Apart",
    title: "Comfy as a Cloud, Built to Last",
    body: "We blend playfulness with practicality — eco-friendly fabrics, meticulous craftsmanship, and love poured into every detail, so your little adventurers are dressed for wherever their dreams may take them.",
    bg: "#F3FAEC",
    accent: "#B8C9A8",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={3.4} amplitude={8} className="absolute top-[26%] left-[34%]">
          <Cloud size={120} />
        </Floating>
        <div className="absolute top-[12%] left-[14%]"><AnimatedSparkle size={12} color="#B8C9A8" /></div>
        <div className="absolute top-[18%] right-[18%]"><AnimatedLeaf size={20} color="#B8C9A8" /></div>
        <div className="absolute bottom-[16%] left-[20%]"><AnimatedFlower size={22} petal="#B8C9A8" /></div>
        <div className="absolute bottom-[22%] right-[20%]"><AnimatedStar size={12} color="#F0B95B" /></div>
      </div>
    ),
  },
  {
    key: "promise",
    eyebrow: "Our Promise",
    title: "Smiles in Every Stitch",
    body: "From cozy sweaters for snuggle time to twirly dresses for a whirlwind of giggles, our collections are curated with care to inspire joy and confidence in every child.",
    bg: "#FFF4E0",
    accent: "#F0B95B",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={4} amplitude={6} className="absolute top-[24%] left-[34%]"><Rainbow size={120} /></Floating>
        <div className="absolute top-[14%] left-[16%]"><DecoHeart size={20} color="#E2889D" /></div>
        <div className="absolute top-[18%] right-[18%]"><AnimatedSparkle size={14} color="#F0B95B" /></div>
        <div className="absolute bottom-[18%] right-[14%]"><Star size={16} color="#F0B95B" /></div>
        <div className="absolute bottom-[16%] left-[18%]"><AnimatedFlower size={22} petal="#F0B95B" /></div>
      </div>
    ),
  },
  {
    key: "crew",
    eyebrow: "Join Our Crew",
    title: "Set Sail With Us",
    body: "Dive into our treasure trove of kids' fashion. Stay connected through our newsletter and social channels for sneak peeks, special offers, and parenting hacks to make every day a little more magical.",
    bg: "#FBEEF6",
    accent: "#E2889D",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={4.2} amplitude={8} className="absolute top-[22%] left-[34%]"><Balloon size={68} color="#E2889D" /></Floating>
        <Floating duration={3.6} amplitude={6} delay={0.4} className="absolute top-[30%] left-[52%]"><Balloon size={54} color="#F0B95B" /></Floating>
        <Floating duration={3.8} amplitude={7} delay={0.8} className="absolute top-[28%] left-[22%]"><Balloon size={48} color="#BDD9E8" /></Floating>
        <div className="absolute top-[10%] right-[20%]"><Bird size={26} color="#BDD9E8" /></div>
        <div className="absolute bottom-[16%] left-[18%]"><AnimatedSparkle size={12} color="#E2889D" /></div>
      </div>
    ),
  },
  {
    key: "contact",
    eyebrow: "Get in Touch",
    title: "Drop Anchor With Us",
    body: "Got questions, comments, or just want to share your little one's latest fashion triumph? Our customer-care cove is always open. Fair winds and happy shopping — Team Creative Kid's.",
    bg: "#EDF6F2",
    accent: "#9FB695",
    Art: () => (
      <div className="relative w-full h-full">
        <Floating duration={3.6} amplitude={8} className="absolute top-[28%] left-[28%]"><Butterfly size={48} color="#E2889D" /></Floating>
        <Floating duration={4} amplitude={6} delay={0.5} className="absolute top-[34%] right-[26%]"><Butterfly size={40} color="#BDD9E8" /></Floating>
        <div className="absolute bottom-[14%] left-[16%]"><Flower size={28} petal="#E2889D" /></div>
        <div className="absolute bottom-[16%] right-[18%]"><Flower size={24} petal="#F0B95B" /></div>
        <div className="absolute top-[12%] left-[18%]"><AnimatedCloud size={38} /></div>
        <div className="absolute bottom-[8%] right-[10%]"><Bunny size={36} /></div>
      </div>
    ),
  },
];

export default function AboutUsCarousel() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStart = useRef(null);

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [paused, reduced]);

  const go = (dir) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  const onTouchStart = (e) => { swipeStart.current = e.targetTouches[0].clientX; };
  const onTouchEnd = (e) => {
    if (swipeStart.current == null) return;
    const dx = swipeStart.current - e.changedTouches[0].clientX;
    if (dx > 50) go(1);
    else if (dx < -50) go(-1);
    swipeStart.current = null;
  };

  const slide = SLIDES[index];

  return (
    <section
      className="relative w-full h-screen min-h-[600px] overflow-hidden bg-white flex flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex-none relative flex flex-col items-center pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-5 bg-white">
        <div aria-hidden="true" className="absolute left-2 sm:left-10 md:left-20 bottom-0 pointer-events-none">
          <Floating duration={3.6} amplitude={4}>
            <div className="block sm:hidden"><HeaderDog size={44} /></div>
            <div className="hidden sm:block"><HeaderDog size={64} /></div>
          </Floating>
        </div>
        <div aria-hidden="true" className="absolute right-4 sm:right-10 md:right-20 top-3 pointer-events-none hidden sm:block">
          <AnimatedSparkle size={14} color={slide.accent} />
        </div>
        <div aria-hidden="true" className="absolute right-12 sm:right-24 md:right-40 bottom-2 pointer-events-none hidden sm:block">
          <AnimatedSparkle size={10} color="#F0B95B" />
        </div>
        <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">Our Story</span>
        <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>
          About Us
        </h2>
        <SquiggleUnderline className="mt-2" color={slide.accent} />
      </div>
      <div className="relative flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col md:grid md:grid-cols-2"
          style={{ background: slide.bg }}
        >
          <div className="relative h-1/2 md:h-full md:order-2 overflow-hidden">
            <slide.Art />
          </div>

          <div className="relative h-1/2 md:h-full md:order-1 flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 py-6 md:py-12">
            <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-bold mb-3 sm:mb-4" style={{ color: slide.accent }}>
              {slide.eyebrow}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-black tracking-wide leading-tight mb-4 sm:mb-6" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>
              {slide.title}
            </h2>
            <SquiggleUnderline className="mb-4 sm:mb-5" color={slide.accent} />
            <p className="text-[13px] sm:text-[15px] md:text-[16px] leading-relaxed text-black/70 max-w-xl">
              {slide.body}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="hidden md:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all shadow-lg"
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
      <button
        aria-label="Next slide"
        onClick={() => go(1)}
        className="hidden md:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all shadow-lg"
      >
        <ChevronRight size={20} strokeWidth={1.5} />
      </button>

      <div className="absolute bottom-5 sm:bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-black" : "w-2 bg-black/25 hover:bg-black/50"}`}
          />
        ))}
      </div>
      </div>
    </section>
  );
}
