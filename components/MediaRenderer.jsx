"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function isVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg)$/i.test(url);
}

export default function MediaRenderer({ 
  src, 
  alt = "", 
  fill = false, 
  priority = false, 
  sizes = "", 
  className = "", 
  hideVolume = false,
  hoverPlay = false,
  poster = "",
  width,
  height,
  ...props 
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(!hoverPlay);
  const videoRef = useRef(null);

  if (!src) {
    src = "/images/logo.png";
  }

  const handleToggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Properly control play/pause via useEffect instead of during render
  useEffect(() => {
    if (!hoverPlay || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying, hoverPlay]);

  const isVid = isVideo(src);

  if (isVid) {
    const combinedClassName = fill 
      ? `absolute inset-0 w-full h-full object-cover ${className}`
      : className;

    return (
      <div 
        className={`relative ${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}`}
        onMouseEnter={() => { if (hoverPlay) setIsPlaying(true); }}
        onMouseLeave={() => { if (hoverPlay) setIsPlaying(false); }}
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay={!hoverPlay}
          loop
          muted={isMuted}
          playsInline
          preload={hoverPlay ? "none" : "auto"}
          poster={poster || undefined}
          className={combinedClassName}
          {...props}
        />
        {!hideVolume && (
          <button
            onClick={handleToggleMute}
            className="absolute bottom-2 left-2 z-10 w-6 h-6 sm:w-8 sm:h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <VolumeX size={14} className="text-white sm:scale-100 scale-75" />
            ) : (
              <Volume2 size={14} className="text-white sm:scale-100 scale-75" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Fallback to Image
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
      className={className}
      width={!fill ? width || 800 : undefined}
      height={!fill ? height || 1000 : undefined}
      {...props}
    />
  );
}
