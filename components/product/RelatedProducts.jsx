"use client";
import Link from "next/link";
import MediaRenderer, { isVideo } from "@/components/product/MediaRenderer";

export default function RelatedProducts({ relatedProducts }) {
  if (!relatedProducts || relatedProducts.length === 0) return null;
  return (
    <section className="border-t border-black/10 py-8 sm:py-12 px-3 sm:px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-[11px] sm:text-[12px] font-bold tracking-widest uppercase text-black mb-5 sm:mb-8">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {relatedProducts.map(p => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              onClick={() => {
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="group flex flex-col"
            >
              <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-2 sm:mb-3">
                <MediaRenderer
                  src={(p.hover_videos && Object.values(p.hover_videos).find(v => v)) || p.image_urls?.find(isVideo) || p.image_urls?.[0] || '/images/logo.png'}
                  poster={p.image_urls?.find(u => !isVideo(u))}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 16vw"
                  hideVolume
                  hoverPlay
                />
              </div>
              <p className="text-[11px] sm:text-[12px] text-black truncate px-0.5">{p.title}</p>
              <p className="text-[11px] sm:text-[12px] font-bold text-black mt-0.5 px-0.5">₹{parseFloat(p.price).toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
