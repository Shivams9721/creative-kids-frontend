export default function AdminLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      {/* Simple CSS Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      <span className="ml-3 text-gray-600 font-medium">Loading...</span>
    </div>
  );
}