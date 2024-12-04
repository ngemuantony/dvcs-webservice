'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RepositoryPage() {
  const params = useParams();
  const [repoData, setRepoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch repository data from your DVCS backend
    const fetchRepoData = async () => {
      try {
        // This will be replaced with actual API call to your DVCS system
        const response = await fetch(`/api/repos/${params.owner}/${params.repo}`);
        const data = await response.json();
        setRepoData(data);
      } catch (error) {
        console.error('Error fetching repository data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepoData();
  }, [params.owner, params.repo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <header className="border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {params.owner}/{params.repo}
          </h1>
          <p className="text-gray-600 mt-2">
            {repoData?.description || 'No description provided'}
          </p>
        </header>

        <nav className="flex space-x-6 mt-4">
          <button className="text-gray-600 hover:text-gray-900">Code</button>
          <button className="text-gray-600 hover:text-gray-900">Issues</button>
          <button className="text-gray-600 hover:text-gray-900">Pull Requests</button>
          <button className="text-gray-600 hover:text-gray-900">Actions</button>
        </nav>

        <div className="mt-8">
          {/* File browser will go here */}
          <div className="border rounded-lg">
            <div className="bg-gray-50 p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <select className="rounded border px-2 py-1">
                    <option>main</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Clone
                  </button>
                  <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                    Download
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {/* File list will go here */}
              <p className="text-gray-600">Loading repository contents...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
