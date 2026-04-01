import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-4">404</p>
      <h1 className="text-3xl md:text-4xl font-light tracking-widest uppercase text-black mb-4">
        Page Not Found
      </h1>
      <p className="text-[13px] text-black/50 mb-10 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="border border-black px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">
          Back to Home
        </Link>
        <Link href="/shop" className="bg-black text-white px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
          Browse Shop
        </Link>
      </div>
    </main>
  );
}
