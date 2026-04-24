"use client";
import { motion, useReducedMotion } from "framer-motion";

// Hand-coded SVG decorations for Creative Kids.
// Palette: pink #E2889D, sage #B8C9A8, amber #F0B95B, sky #BDD9E8, cream #FBF7F0, brown #8B6F4E
// All decorative — aria-hidden. Sized by props.

export function SquiggleUnderline({ className = "", color = "#E2889D", width = 80 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 8" width={width} height={(8 * width) / 80} fill="none" className={className}>
      <path d="M1 4 Q 10 0, 20 4 T 40 4 T 60 4 T 79 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function WavyDivider({ className = "", color = "rgba(0,0,0,0.12)" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1600 12" preserveAspectRatio="none" className={`block w-full h-3 ${className}`} fill="none">
      <path d="M0 6 Q 100 0, 200 6 T 400 6 T 600 6 T 800 6 T 1000 6 T 1200 6 T 1400 6 T 1600 6" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function Leaf({ className = "", size = 14, color = "#B8C9A8" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} fill="none" className={className}>
      <path d="M2 14 C 2 6, 8 2, 14 2 C 14 8, 10 14, 2 14 Z" fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      <path d="M3 13 Q 8 8, 13 3" stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle({ className = "", size = 10, color = "#E2889D" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" width={size} height={size} fill="none" className={className}>
      <path d="M6 0 L 7 5 L 12 6 L 7 7 L 6 12 L 5 7 L 0 6 L 5 5 Z" fill={color} />
    </svg>
  );
}

export function Cloud({ className = "", size = 60, color = "#FFFFFF", stroke = "rgba(0,0,0,0.15)" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 32" width={size} height={(32 * size) / 60} fill="none" className={className}>
      <path d="M10 22 C 4 22, 4 14, 10 14 C 11 9, 17 8, 20 12 C 22 6, 32 6, 34 12 C 40 10, 46 14, 44 20 C 50 20, 52 28, 46 28 L 12 28 C 6 28, 6 22, 10 22 Z" fill={color} stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

export function Star({ className = "", size = 18, color = "#F0B95B", stroke = "rgba(0,0,0,0.2)" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" className={className}>
      <path d="M12 2 L 14.5 9 L 22 9 L 16 13.5 L 18.5 21 L 12 16.5 L 5.5 21 L 8 13.5 L 2 9 L 9.5 9 Z" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function Heart({ className = "", size = 18, color = "#E2889D", stroke = "rgba(0,0,0,0.2)" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 22" width={size} height={(22 * size) / 24} fill="none" className={className}>
      <path d="M12 20 C 12 20, 2 14, 2 7 C 2 3, 5 1, 7 1 C 9 1, 11 2, 12 5 C 13 2, 15 1, 17 1 C 19 1, 22 3, 22 7 C 22 14, 12 20, 12 20 Z" fill={color} stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

export function Flower({ className = "", size = 24, petal = "#E2889D", center = "#F0B95B" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" className={className}>
      <circle cx="12" cy="5" r="3.2" fill={petal} />
      <circle cx="12" cy="19" r="3.2" fill={petal} />
      <circle cx="5" cy="12" r="3.2" fill={petal} />
      <circle cx="19" cy="12" r="3.2" fill={petal} />
      <circle cx="7" cy="7" r="2.8" fill={petal} opacity="0.85" />
      <circle cx="17" cy="7" r="2.8" fill={petal} opacity="0.85" />
      <circle cx="7" cy="17" r="2.8" fill={petal} opacity="0.85" />
      <circle cx="17" cy="17" r="2.8" fill={petal} opacity="0.85" />
      <circle cx="12" cy="12" r="3.2" fill={center} stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
    </svg>
  );
}

export function Bird({ className = "", size = 28, color = "#BDD9E8", stroke = "rgba(0,0,0,0.3)" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 24" width={size} height={(24 * size) / 32} fill="none" className={className}>
      <path d="M2 14 Q 8 4, 16 10 Q 24 4, 30 14 Q 24 16, 16 14 Q 8 16, 2 14 Z" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
      <circle cx="16" cy="11" r="1" fill="#000" />
      <path d="M18 12 L 21 12" stroke="#F0B95B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Balloon({ className = "", size = 28, color = "#E2889D", stroke = "rgba(0,0,0,0.25)" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 36" width={size} height={(36 * size) / 24} fill="none" className={className}>
      <ellipse cx="12" cy="12" rx="9" ry="11" fill={color} stroke={stroke} strokeWidth="1" />
      <path d="M12 23 L 11 25 L 13 25 Z" fill={stroke} />
      <path d="M12 25 Q 14 30, 11 36" stroke={stroke} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <ellipse cx="9" cy="9" rx="1.8" ry="2.5" fill="white" opacity="0.5" />
    </svg>
  );
}

export function Grass({ className = "", size = 40, color = "#B8C9A8" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 20" width={size} height={(20 * size) / 40} fill="none" className={className}>
      <path d="M2 20 Q 4 10, 6 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M6 20 Q 9 6, 12 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 20 Q 15 10, 18 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 20 Q 21 4, 24 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M24 20 Q 27 12, 30 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M30 20 Q 33 8, 36 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M36 20 Q 38 14, 39 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Tree({ className = "", size = 60 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 56" width={size} height={(56 * size) / 40} fill="none" className={className}>
      <rect x="17" y="34" width="6" height="20" fill="#8B6F4E" stroke="rgba(0,0,0,0.3)" strokeWidth="1" rx="1" />
      <circle cx="20" cy="20" r="16" fill="#B8C9A8" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx="13" cy="14" r="2" fill="#9FB695" opacity="0.6" />
      <circle cx="26" cy="18" r="2.5" fill="#9FB695" opacity="0.6" />
      <circle cx="18" cy="26" r="2" fill="#9FB695" opacity="0.6" />
    </svg>
  );
}

// The mascot — a simple geometric girl character.
// Default: neutral standing pose. Can be mirrored with className="scale-x-[-1]".
export function Mascot({ className = "", size = 120, pose = "stand" }) {
  // Color tokens kept consistent across poses
  const skin = "#F7D6BE";
  const skinShade = "#E8C0A3";
  const hair = "#5D3B24";
  const dress = "#B8C9A8";
  const dressDark = "#9AAF8A";
  const shirt = "#FBF7F0";
  const cheek = "#F4A7B9";
  const shoe = "#5D3B24";
  const stroke = "rgba(0,0,0,0.4)";
  const sw = 1.2;

  if (pose === "wave") {
    return (
      <svg aria-hidden="true" viewBox="0 0 120 160" width={size} height={(160 * size) / 120} fill="none" className={className}>
        {/* legs */}
        <rect x="50" y="120" width="8" height="25" fill={skin} stroke={stroke} strokeWidth={sw} rx="3" />
        <rect x="62" y="120" width="8" height="25" fill={skin} stroke={stroke} strokeWidth={sw} rx="3" />
        {/* shoes */}
        <ellipse cx="54" cy="147" rx="6" ry="3.5" fill={shoe} stroke={stroke} strokeWidth={sw} />
        <ellipse cx="66" cy="147" rx="6" ry="3.5" fill={shoe} stroke={stroke} strokeWidth={sw} />
        {/* dress */}
        <path d="M38 80 L 82 80 L 90 125 L 30 125 Z" fill={dress} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M38 80 L 82 80" stroke={dressDark} strokeWidth="2" />
        {/* shirt collar */}
        <path d="M48 75 L 60 82 L 72 75 L 72 80 L 48 80 Z" fill={shirt} stroke={stroke} strokeWidth={sw} />
        {/* left arm (down) */}
        <path d="M40 82 Q 34 100, 36 115" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
        <rect x="33" y="80" width="8" height="32" rx="4" fill={skin} stroke={stroke} strokeWidth={sw} />
        {/* right arm (waving up) */}
        <path d="M80 80 Q 95 70, 92 50" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
        <rect x="78" y="76" width="8" height="30" rx="4" fill={skin} stroke={stroke} strokeWidth={sw} transform="rotate(-35 82 91)" />
        <circle cx="94" cy="48" r="5" fill={skin} stroke={stroke} strokeWidth={sw} />
        {/* head */}
        <circle cx="60" cy="50" r="26" fill={skin} stroke={stroke} strokeWidth={sw} />
        {/* hair buns */}
        <circle cx="40" cy="30" r="10" fill={hair} stroke={stroke} strokeWidth={sw} />
        <circle cx="80" cy="30" r="10" fill={hair} stroke={stroke} strokeWidth={sw} />
        {/* hair fringe */}
        <path d="M38 38 Q 45 28, 60 30 Q 75 28, 82 38 Q 78 32, 60 32 Q 42 32, 38 38 Z" fill={hair} stroke={stroke} strokeWidth={sw} />
        <path d="M36 40 Q 40 60, 36 70" stroke={hair} strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M84 40 Q 80 60, 84 70" stroke={hair} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* cheeks */}
        <circle cx="47" cy="58" r="3.5" fill={cheek} opacity="0.7" />
        <circle cx="73" cy="58" r="3.5" fill={cheek} opacity="0.7" />
        {/* eyes */}
        <circle cx="52" cy="52" r="2" fill="#222" />
        <circle cx="68" cy="52" r="2" fill="#222" />
        <circle cx="52.8" cy="51.3" r="0.6" fill="white" />
        <circle cx="68.8" cy="51.3" r="0.6" fill="white" />
        {/* smile */}
        <path d="M54 62 Q 60 66, 66 62" stroke="#222" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  if (pose === "read") {
    return (
      <svg aria-hidden="true" viewBox="0 0 140 140" width={size} height={size} fill="none" className={className}>
        {/* seated body */}
        <path d="M30 120 Q 70 100, 110 120 L 110 130 L 30 130 Z" fill={dress} stroke={stroke} strokeWidth={sw} />
        {/* book */}
        <path d="M45 95 L 70 90 L 95 95 L 95 115 L 70 110 L 45 115 Z" fill={shirt} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M70 90 L 70 110" stroke={stroke} strokeWidth={sw} />
        <path d="M52 100 L 64 98 M 52 105 L 64 103" stroke={stroke} strokeWidth="0.7" />
        <path d="M76 98 L 88 100 M 76 103 L 88 105" stroke={stroke} strokeWidth="0.7" />
        {/* arms holding book */}
        <path d="M35 100 Q 42 98, 48 100" stroke={stroke} strokeWidth={sw} fill={skin} />
        <circle cx="40" cy="100" r="5" fill={skin} stroke={stroke} strokeWidth={sw} />
        <circle cx="100" cy="100" r="5" fill={skin} stroke={stroke} strokeWidth={sw} />
        {/* head */}
        <circle cx="70" cy="55" r="26" fill={skin} stroke={stroke} strokeWidth={sw} />
        <circle cx="50" cy="35" r="10" fill={hair} stroke={stroke} strokeWidth={sw} />
        <circle cx="90" cy="35" r="10" fill={hair} stroke={stroke} strokeWidth={sw} />
        <path d="M48 43 Q 55 33, 70 35 Q 85 33, 92 43 Q 88 37, 70 37 Q 52 37, 48 43 Z" fill={hair} stroke={stroke} strokeWidth={sw} />
        {/* eyes closed (reading) */}
        <path d="M58 56 Q 62 59, 66 56" stroke="#222" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M74 56 Q 78 59, 82 56" stroke="#222" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <circle cx="55" cy="62" r="3" fill={cheek} opacity="0.7" />
        <circle cx="85" cy="62" r="3" fill={cheek} opacity="0.7" />
        <path d="M65 68 Q 70 71, 75 68" stroke="#222" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  if (pose === "peek") {
    // Head-only peek for corners
    return (
      <svg aria-hidden="true" viewBox="0 0 120 80" width={size} height={(80 * size) / 120} fill="none" className={className}>
        <circle cx="60" cy="70" r="30" fill={skin} stroke={stroke} strokeWidth={sw} />
        <circle cx="36" cy="50" r="12" fill={hair} stroke={stroke} strokeWidth={sw} />
        <circle cx="84" cy="50" r="12" fill={hair} stroke={stroke} strokeWidth={sw} />
        <path d="M34 60 Q 45 48, 60 50 Q 75 48, 86 60 Q 80 54, 60 54 Q 40 54, 34 60 Z" fill={hair} stroke={stroke} strokeWidth={sw} />
        <circle cx="45" cy="78" r="4" fill={cheek} opacity="0.7" />
        <circle cx="75" cy="78" r="4" fill={cheek} opacity="0.7" />
        <circle cx="50" cy="70" r="2.4" fill="#222" />
        <circle cx="70" cy="70" r="2.4" fill="#222" />
        <circle cx="51" cy="69" r="0.7" fill="white" />
        <circle cx="71" cy="69" r="0.7" fill="white" />
        <path d="M52 80 Q 60 84, 68 80" stroke="#222" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // default stand
  return (
    <svg aria-hidden="true" viewBox="0 0 120 160" width={size} height={(160 * size) / 120} fill="none" className={className}>
      <rect x="50" y="120" width="8" height="25" fill={skin} stroke={stroke} strokeWidth={sw} rx="3" />
      <rect x="62" y="120" width="8" height="25" fill={skin} stroke={stroke} strokeWidth={sw} rx="3" />
      <ellipse cx="54" cy="147" rx="6" ry="3.5" fill={shoe} stroke={stroke} strokeWidth={sw} />
      <ellipse cx="66" cy="147" rx="6" ry="3.5" fill={shoe} stroke={stroke} strokeWidth={sw} />
      <path d="M38 80 L 82 80 L 90 125 L 30 125 Z" fill={dress} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M38 80 L 82 80" stroke={dressDark} strokeWidth="2" />
      <path d="M48 75 L 60 82 L 72 75 L 72 80 L 48 80 Z" fill={shirt} stroke={stroke} strokeWidth={sw} />
      <rect x="33" y="80" width="8" height="32" rx="4" fill={skin} stroke={stroke} strokeWidth={sw} />
      <rect x="79" y="80" width="8" height="32" rx="4" fill={skin} stroke={stroke} strokeWidth={sw} />
      <circle cx="60" cy="50" r="26" fill={skin} stroke={stroke} strokeWidth={sw} />
      <circle cx="40" cy="30" r="10" fill={hair} stroke={stroke} strokeWidth={sw} />
      <circle cx="80" cy="30" r="10" fill={hair} stroke={stroke} strokeWidth={sw} />
      <path d="M38 38 Q 45 28, 60 30 Q 75 28, 82 38 Q 78 32, 60 32 Q 42 32, 38 38 Z" fill={hair} stroke={stroke} strokeWidth={sw} />
      <circle cx="47" cy="58" r="3.5" fill={cheek} opacity="0.7" />
      <circle cx="73" cy="58" r="3.5" fill={cheek} opacity="0.7" />
      <circle cx="52" cy="52" r="2" fill="#222" />
      <circle cx="68" cy="52" r="2" fill="#222" />
      <circle cx="52.8" cy="51.3" r="0.6" fill="white" />
      <circle cx="68.8" cy="51.3" r="0.6" fill="white" />
      <path d="M54 62 Q 60 66, 66 62" stroke="#222" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BouncingBalloonLoader({ className = "", label = "Loading" }) {
  const reduced = useReducedMotion();
  const bounce = reduced ? {} : { animate: { y: [0, -14, 0] }, transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } };
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div {...bounce}><Balloon size={36} color="#E2889D" /></motion.div>
      <span className="text-[10px] tracking-[0.3em] uppercase text-black/40">{label}</span>
    </div>
  );
}

// Pre-composed scenes
export function EmptyCartScene({ className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-4 py-8 ${className}`}>
      <div className="relative">
        <Mascot pose="read" size={140} />
        <Sparkle className="absolute -top-2 -right-2" size={14} color="#F0B95B" />
        <Heart className="absolute top-4 -left-4" size={14} color="#E2889D" />
      </div>
      <p className="text-[12px] tracking-widest uppercase text-black/60">Your cart is empty</p>
    </div>
  );
}

export function FooterScene({ className = "" }) {
  const reduced = useReducedMotion();
  const drift = reduced ? {} : { animate: { x: [0, 8, 0] }, transition: { duration: 9, repeat: Infinity, ease: "easeInOut" } };
  const drift2 = reduced ? {} : { animate: { x: [0, -6, 0] }, transition: { duration: 11, repeat: Infinity, ease: "easeInOut" } };
  const flap = reduced ? {} : { animate: { y: [0, -4, 0] }, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } };
  const sway = reduced ? {} : { animate: { rotate: [-1.5, 1.5, -1.5] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } };
  const swayFlower = (dur, delay = 0) => reduced ? {} : ({ animate: { rotate: [-6, 6, -6] }, transition: { duration: dur, repeat: Infinity, ease: "easeInOut", delay } });
  const swayGrass = (dur, delay = 0) => reduced ? {} : ({ animate: { rotate: [-3, 3, -3] }, transition: { duration: dur, repeat: Infinity, ease: "easeInOut", delay } });

  const flowerColors = ["#E2889D", "#F0B95B", "#BDD9E8", "#E2889D", "#F0B95B", "#BDD9E8", "#E2889D"];
  const flowerSpots = [8, 22, 48, 62, 76, 84, 94];

  return (
    <div className={`relative w-full h-40 sm:h-44 overflow-hidden ${className}`}>
      {/* Sky */}
      <motion.div className="absolute top-4 left-1/3" {...drift}><Cloud size={48} /></motion.div>
      <motion.div className="absolute top-8 right-1/4" {...drift2}><Cloud size={34} /></motion.div>
      <motion.div className="absolute top-6 left-1/2" {...flap}><Bird size={26} /></motion.div>

      {/* Trees & mascot */}
      <motion.div className="absolute left-4 bottom-4 origin-bottom" {...sway}><Tree size={110} /></motion.div>
      <div className="absolute left-32 bottom-4"><Mascot pose="stand" size={120} /></div>
      <motion.div className="absolute right-4 bottom-4 origin-bottom" {...sway}><Tree size={96} /></motion.div>

      {/* Ground: grass tufts spread across */}
      <motion.div className="absolute bottom-0 left-[4%] origin-bottom" {...swayGrass(3.4, 0)}><Grass size={46} /></motion.div>
      <motion.div className="absolute bottom-0 left-[16%] origin-bottom" {...swayGrass(3.8, 0.4)}><Grass size={38} color="#9FB695" /></motion.div>
      <motion.div className="absolute bottom-0 left-[34%] origin-bottom" {...swayGrass(4.1, 0.8)}><Grass size={50} /></motion.div>
      <motion.div className="absolute bottom-0 left-[52%] origin-bottom" {...swayGrass(3.2, 0.2)}><Grass size={40} color="#9FB695" /></motion.div>
      <motion.div className="absolute bottom-0 left-[68%] origin-bottom" {...swayGrass(3.7, 0.6)}><Grass size={44} /></motion.div>
      <motion.div className="absolute bottom-0 left-[82%] origin-bottom" {...swayGrass(4, 1)}><Grass size={36} color="#9FB695" /></motion.div>
      <motion.div className="absolute bottom-0 left-[93%] origin-bottom" {...swayGrass(3.5, 0.3)}><Grass size={42} /></motion.div>

      {/* Flowers dotted along the ground */}
      {flowerSpots.map((left, i) => (
        <motion.div
          key={i}
          className="absolute bottom-1 origin-bottom"
          style={{ left: `${left}%` }}
          {...swayFlower(3 + (i % 3) * 0.5, (i % 4) * 0.3)}
        >
          <Flower size={16 + (i % 2) * 4} petal={flowerColors[i]} />
        </motion.div>
      ))}
    </div>
  );
}

export function AnimatedSparkle(props) {
  const reduced = useReducedMotion();
  if (reduced) return <Sparkle {...props} />;
  return (
    <motion.span
      className="inline-block"
      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <Sparkle {...props} />
    </motion.span>
  );
}

export function AnimatedCloud(props) {
  const reduced = useReducedMotion();
  if (reduced) return <Cloud {...props} />;
  return (
    <motion.span
      className="inline-block"
      animate={{ x: [0, 10, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      <Cloud {...props} />
    </motion.span>
  );
}

export function AnimatedStar(props) {
  const reduced = useReducedMotion();
  if (reduced) return <Star {...props} />;
  return (
    <motion.span
      className="inline-block"
      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <Star {...props} />
    </motion.span>
  );
}

export function AnimatedFlower(props) {
  const reduced = useReducedMotion();
  if (reduced) return <Flower {...props} />;
  return (
    <motion.span
      className="inline-block origin-center"
      animate={{ rotate: [0, 6, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Flower {...props} />
    </motion.span>
  );
}

export function AnimatedLeaf(props) {
  const reduced = useReducedMotion();
  if (reduced) return <Leaf {...props} />;
  return (
    <motion.span
      className="inline-block origin-bottom"
      animate={{ rotate: [-8, 8, -8] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Leaf {...props} />
    </motion.span>
  );
}
