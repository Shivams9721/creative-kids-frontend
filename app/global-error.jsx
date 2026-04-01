'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-4">Something went wrong</p>
          <h1 className="text-3xl font-light tracking-widest uppercase text-black mb-4">
            Unexpected Error
          </h1>
          <p className="text-[13px] text-black/50 mb-10 max-w-sm">
            We're sorry — something went wrong on our end. Please try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={reset}
              className="bg-black text-white px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors"
            >
              Try Again
            </button>
            <Link href="/" className="border border-black px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">
              Back to Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
