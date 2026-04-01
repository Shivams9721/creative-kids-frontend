"use client"; // Error components must be Client Components

import { useEffect } from 'react';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    // In production, you might log this to a service like Sentry
    console.error("Admin Panel Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
      <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
      <p className="text-gray-600">{error.message || "An unexpected error occurred in the admin panel."}</p>
      <button
        onClick={() => reset()} // Attempts to recover by re-rendering the segment
        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}