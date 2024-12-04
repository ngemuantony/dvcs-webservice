'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from './ui/Button';
import { 
  formatClientDate, 
  useClientSide, 
  generateClientId,
  createSafeInitialState
} from '@/lib/client-utils';

interface Repository {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  owner: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function RepositoryDashboard() {
  const isClient = useClientSide();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use safe initial state creation
  const [newRepo, setNewRepo] = useState(() => 
    createSafeInitialState({
      id: generateClientId('repo'),
      name: '',
      description: '',
      isPrivate: false
    })
  );

  useEffect(() => {
    if (isClient) {
      fetchRepositories();
    }
  }, [isClient]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/repositories');
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepositories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRepo,
          id: generateClientId('repo') // Ensure unique ID
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create repository');
      }

      const createdRepo = await response.json();
      setRepositories(prev => [...prev, createdRepo]);
      
      // Reset form
      setNewRepo(prev => ({
        id: generateClientId('repo'),
        name: '',
        description: '',
        isPrivate: false
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRepository = async (repoId: string) => {
    if (isClient && !window.confirm('Are you sure you want to delete this repository? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/${repoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete repository');
      }

      setRepositories(prev => prev.filter(repo => repo.id !== repoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (!isClient || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Repository Creation Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Create New Repository</h2>
          <form onSubmit={createRepository}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Repository Name
              </label>
              <input
                type="text"
                id="name"
                value={newRepo.name}
                onChange={(e) => setNewRepo(prev => ({...prev, name: e.target.value}))}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                placeholder="my-awesome-project"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={newRepo.description}
                onChange={(e) => setNewRepo(prev => ({...prev, description: e.target.value}))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                placeholder="A brief description of your project"
              />
            </div>
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={newRepo.isPrivate}
                  onChange={(e) => setNewRepo(prev => ({...prev, isPrivate: e.target.checked}))}
                  className="form-checkbox"
                />
                <span className="ml-2">Private Repository</span>
              </label>
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Repository
            </Button>
          </form>
        </div>

        {/* Repository List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold">Your Repositories</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}
          {repositories.length === 0 ? (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <p className="text-gray-600">
                You haven't created any repositories yet. 
                Start by creating your first repository!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {repositories.map((repo) => (
                <div 
                  key={repo.id} 
                  className="bg-white shadow rounded-lg p-6 flex justify-between items-center"
                >
                  <div>
                    <Link href={`/repo/${repo.owner.email}/${repo.name}`}>
                      <h3 className="text-xl font-semibold text-blue-600 hover:underline">
                        {repo.owner.email}/{repo.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mt-2">{repo.description || 'No description'}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          repo.isPrivate 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Created {formatClientDate(repo.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteRepository(repo.id)}
                    >
                      Delete
                    </Button>
                    <Link href={`/repo/${repo.owner.email}/${repo.name}`}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
