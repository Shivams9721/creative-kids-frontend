import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4 p-4 text-center">
      <h2 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h2>
      <p className="text-gray-600">We couldn't find the page you were looking for.</p>
      <Link 
        href="/admin/dashboard" 
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}