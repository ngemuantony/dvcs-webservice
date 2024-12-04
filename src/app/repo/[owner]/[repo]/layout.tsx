'use client';

import { useParams } from 'next/navigation';

export default function RepoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-4">
            <a href="/" className="text-gray-900 hover:text-blue-600">Home</a>
            <span className="text-gray-400">/</span>
            <a href={`/${params.owner}`} className="text-gray-900 hover:text-blue-600">
              {params.owner}
            </a>
            <span className="text-gray-400">/</span>
            <a href={`/${params.owner}/${params.repo}`} className="text-gray-900 hover:text-blue-600">
              {params.repo}
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
