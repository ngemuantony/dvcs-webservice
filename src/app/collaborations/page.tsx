'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SideNavigation from '@/components/SideNavigation';

interface Collaboration {
  id: string;
  repository: {
    name: string;
    owner: string;
  };
  role: 'READ' | 'WRITE' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function CollaborationsPage() {
  const { data: session } = useSession();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        const response = await fetch('/api/collaborations');
        const result = await response.json();

        if (result.success) {
          setCollaborations(result.collaborations);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Fetch collaborations error:', err);
        setError('Failed to fetch collaborations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollaborations();
  }, []);

  const handleCollaborationAction = async (
    collaborationId: string, 
    action: 'ACCEPT' | 'REJECT'
  ) => {
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setCollaborations(prev => 
          prev.map(collab => 
            collab.id === collaborationId 
              ? { ...collab, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }
              : collab
          )
        );
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Collaboration action error:', err);
      setError('Failed to process collaboration request');
    }
  };

  return (
    <div className="flex min-h-screen">
      <SideNavigation />
      
      <main className="flex-grow bg-gray-100 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Collaborations
          </h1>

          {isLoading ? (
            <div className="text-center text-gray-600">Loading collaborations...</div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : collaborations.length === 0 ? (
            <div className="text-center text-gray-600">
              No collaborations found
            </div>
          ) : (
            <div className="grid gap-4">
              {collaborations.map((collab) => (
                <div 
                  key={collab.id} 
                  className="bg-white shadow-md rounded-lg p-6 flex justify-between items-center"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {collab.repository.name}
                    </h2>
                    <p className="text-gray-600">
                      Owned by {collab.repository.owner}
                    </p>
                    <span 
                      className={`
                        inline-block px-2 py-1 rounded-full text-xs font-bold
                        ${
                          collab.role === 'ADMIN' 
                            ? 'bg-green-100 text-green-800'
                            : collab.role === 'WRITE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {collab.role}
                    </span>
                  </div>

                  {collab.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCollaborationAction(collab.id, 'ACCEPT')}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleCollaborationAction(collab.id, 'REJECT')}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {collab.status === 'ACCEPTED' && (
                    <span className="text-green-600 font-semibold">
                      Accepted
                    </span>
                  )}

                  {collab.status === 'REJECTED' && (
                    <span className="text-red-600 font-semibold">
                      Rejected
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
