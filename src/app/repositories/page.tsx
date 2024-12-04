'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RepositoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Fetch repositories when session is available
    if (status === 'authenticated') {
      const fetchRepositories = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/repositories', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch repositories: ${errorText}`);
          }

          const data = await response.json();
          
          if (data.success) {
            setRepositories(data.repositories || []);
            setError(null);
          } else {
            setError(data.error || 'An unknown error occurred');
          }
        } catch (err) {
          console.error('Repositories fetch error:', err);
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
          setIsLoading(false);
        }
      };

      fetchRepositories();
    }
  }, [status, router]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 bg-gray-300 w-64 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-300 w-40 animate-pulse rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((_, index) => (
              <div 
                key={index} 
                className="bg-white shadow-md rounded-lg p-6 space-y-4"
              >
                <div className="h-6 bg-gray-300 w-3/4 animate-pulse rounded"></div>
                <div className="h-4 bg-gray-300 w-full animate-pulse rounded"></div>
                <div className="h-4 bg-gray-300 w-5/6 animate-pulse rounded"></div>
                
                <div className="flex justify-between items-center pt-4">
                  <div className="h-6 bg-gray-300 w-20 animate-pulse rounded-full"></div>
                  <div className="h-6 bg-gray-300 w-24 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-red-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Repositories</h1>
          <Link 
            href="/repositories/new" 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Create Repository
          </Link>
        </div>

        {repositories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              You don't have any repositories yet.
            </p>
            <p className="text-gray-500 mt-2">
              Create your first repository to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <div 
                key={repo.id} 
                className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {repo.name}
                </h2>
                <p className="text-gray-600 mb-4">
                  {repo.description || 'No description'}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`
                    px-3 py-1 rounded-full text-sm 
                    ${repo.isPrivate ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                  `}>
                    {repo.isPrivate ? 'Private' : 'Public'}
                  </span>
                  <Link 
                    href={`/repo/${session?.user?.name}/${repo.name}`} 
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
