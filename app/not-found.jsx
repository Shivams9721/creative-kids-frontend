"use client";
import Link from 'next/link';
import { Mascot, Balloon, AnimatedCloud, AnimatedSparkle, SquiggleUnderline, WavyDivider } from '@/components/decorations';
import { motion, useReducedMotion } from 'framer-motion';

export default function NotFound() {
  const reduced = useReducedMotion();
  const float = reduced ? {} : { animate: { y: [0, -8, 0] }, transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } };
  const tilt = reduced ? {} : { animate: { rotate: [-3, 3, -3] }, transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <div className="absolute top-10 left-8 opacity-70"><AnimatedCloud size={72} /></div>
      <div className="absolute top-20 right-12 opacity-70"><AnimatedCloud size={54} /></div>
      <div className="absolute top-32 left-1/3 hidden md:block"><AnimatedSparkle size={14} color="#F0B95B" /></div>
      <div className="absolute bottom-32 right-1/4 hidden md:block"><AnimatedSparkle size={12} color="#E2889D" /></div>

      <motion.div {...tilt} className="origin-bottom">
        <Mascot pose="wave" size={160} />
      </motion.div>

      <motion.div {...float} className="absolute top-24 right-[30%] hidden md:block">
        <Balloon size={42} color="#E2889D" />
      </motion.div>

      <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mt-4 mb-2">Oops — 404</p>
      <h1 className="text-2xl md:text-3xl font-light tracking-widest uppercase text-black mb-1">
        Looks like this page wandered off
      </h1>
      <SquiggleUnderline className="mt-1 mb-6" color="#E2889D" width={140} />

      <p className="text-[13px] text-black/50 mb-8 max-w-sm">
        Don't worry — we'll help you find your way back.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <Link href="/" className="border border-black px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">
          Back to Home
        </Link>
        <Link href="/shop" className="bg-black text-white px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
          Browse Shop
        </Link>
      </div>

      <WavyDivider className="absolute bottom-0 left-0" color="rgba(0,0,0,0.12)" />
    </main>
  );
}
