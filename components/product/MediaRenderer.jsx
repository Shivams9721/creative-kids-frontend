"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function isVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
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
  quality = 95,
  ...props
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
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

  // Control play/pause on hover
  useEffect(() => {
    if (!hoverPlay || !videoRef.current) return;
    if (isHovering) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovering, hoverPlay]);

  const onEnter = useCallback(() => setIsHovering(true), []);
  const onLeave = useCallback(() => setIsHovering(false), []);

  const isVid = isVideo(src);

  // === HOVER-PLAY VIDEO MODE ===
  // Show poster image by default, swap to video only on hover
  if (isVid && hoverPlay && poster) {
    const wrapperClass = fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full';
    const mediaClass = fill 
      ? `absolute inset-0 w-full h-full object-cover ${className}`
      : className;

    return (
      <div className={`relative ${wrapperClass}`} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {/* Poster image — always rendered, hidden when hovering */}
        <img
          src={poster}
          alt={alt}
          className={mediaClass}
          style={{ display: isHovering ? 'none' : 'block' }}
          draggable={false}
        />
        {/* Video — always in DOM (preloads metadata), shown only on hover */}
        <video
          ref={videoRef}
          src={src}
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          className={mediaClass}
          style={{ display: isHovering ? 'block' : 'none' }}
        />
        {/* Play/Mute toggle button when hovering */}
        {isHovering && !hideVolume && (
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

  // === NORMAL (AUTO-PLAY) VIDEO MODE ===
  if (isVid) {
    const combinedClassName = fill 
      ? `absolute inset-0 w-full h-full object-cover ${className}`
      : className;

    return (
      <div 
        className={`relative ${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}`}
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="auto"
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

  // === IMAGE MODE ===
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
      quality={quality}
      {...props}
    />
  );
}
