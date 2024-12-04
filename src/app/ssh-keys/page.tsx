'use client';

import { useState, useEffect } from 'react';
import { FaKey, FaTrash, FaCopy } from 'react-icons/fa';
import SideNavigation from '@/components/SideNavigation';

interface SSHKey {
  id: string;
  title: string;
  fingerprint: string;
  createdAt: string;
}

export default function SSHKeysPage() {
  const [sshKeys, setSSHKeys] = useState<SSHKey[]>([]);
  const [newKey, setNewKey] = useState({
    title: '',
    publicKey: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSSHKeys();
  }, []);

  const fetchSSHKeys = async () => {
    try {
      const response = await fetch('/api/ssh-keys');
      const result = await response.json();

      if (result.success) {
        setSSHKeys(result.sshKeys);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Fetch SSH keys error:', err);
      setError('Failed to fetch SSH keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/ssh-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKey)
      });

      const result = await response.json();

      if (result.success) {
        // Refresh keys and reset form
        fetchSSHKeys();
        setNewKey({ title: '', publicKey: '' });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Add SSH key error:', err);
      setError('Failed to add SSH key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/ssh-keys/${keyId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove key from local state
        setSSHKeys(prev => prev.filter(key => key.id !== keyId));
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Delete SSH key error:', err);
      setError('Failed to delete SSH key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard');
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  return (
    <div className="flex min-h-screen">
      <SideNavigation />
      
      <main className="flex-grow bg-gray-100 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            SSH Keys Management
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Add SSH Key Form */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Add New SSH Key
              </h2>
              <form onSubmit={handleAddKey} className="space-y-4">
                <div>
                  <label 
                    htmlFor="title" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Key Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newKey.title}
                    onChange={(e) => setNewKey(prev => ({ 
                      ...prev, 
                      title: e.target.value 
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="My Laptop"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="publicKey" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Public Key
                  </label>
                  <textarea
                    id="publicKey"
                    value={newKey.publicKey}
                    onChange={(e) => setNewKey(prev => ({ 
                      ...prev, 
                      publicKey: e.target.value 
                    }))}
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Paste your public SSH key here"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add SSH Key
                </button>
              </form>
            </div>

            {/* SSH Keys List */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Your SSH Keys
              </h2>

              {isLoading ? (
                <div className="text-center text-gray-600">
                  Loading SSH keys...
                </div>
              ) : sshKeys.length === 0 ? (
                <div className="text-center text-gray-600">
                  No SSH keys found
                </div>
              ) : (
                <div className="space-y-4">
                  {sshKeys.map((key) => (
                    <div 
                      key={key.id} 
                      className="bg-gray-100 p-4 rounded-md flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <FaKey className="text-indigo-600" />
                          <h3 className="font-semibold">{key.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-[250px]">
                          Fingerprint: {key.fingerprint}
                        </p>
                        <p className="text-xs text-gray-500">
                          Added: {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(key.fingerprint)}
                          className="text-gray-600 hover:text-indigo-600"
                          title="Copy Fingerprint"
                        >
                          <FaCopy />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Key"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
