// Shown instantly during client-side navigation between products.
// Mirrors the ProductClient layout so the page feels responsive.
export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Breadcrumb skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-3 w-12 bg-black/5 rounded animate-pulse" />
          <div className="h-3 w-3 bg-black/5 rounded animate-pulse" />
          <div className="h-3 w-20 bg-black/5 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          {/* Image gallery skeleton */}
          <div className="space-y-2">
            <div className="aspect-[3/4] bg-black/5 rounded-md animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-black/5 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4 pt-2">
            <div className="h-3 w-24 bg-black/5 rounded animate-pulse" />
            <div className="h-7 w-3/4 bg-black/5 rounded animate-pulse" />
            <div className="h-5 w-32 bg-black/5 rounded animate-pulse" />

            <div className="pt-4 space-y-2">
              <div className="h-3 w-12 bg-black/5 rounded animate-pulse" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-9 w-9 rounded-full bg-black/5 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <div className="h-3 w-12 bg-black/5 rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 w-14 rounded-md bg-black/5 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <div className="h-[54px] w-full rounded-full bg-black/5 animate-pulse" />
              <div className="h-[54px] w-full rounded-full bg-black/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Top progress strip — gives a moving signal even on slow networks */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-black/10 z-[80] overflow-hidden">
        <div
          className="h-full bg-black"
          style={{
            width: "30%",
            animation: "ck-loading-bar 1.2s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes ck-loading-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(180%); }
          100% { transform: translateX(380%); }
        }
      `}</style>
    </main>
  );
}
