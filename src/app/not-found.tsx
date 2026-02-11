import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold text-black">404</h1>
        <p className="mb-6 text-lg text-gray-500">Page not found</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-black bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
