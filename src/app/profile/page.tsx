'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import SideNavigation from '@/components/SideNavigation';

interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  location?: string;
  publicRepositoriesCount: number;
  privateRepositoriesCount: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const result = await response.json();

        if (result.success) {
          setProfile(result.profile);
          setFormData({
            name: result.profile.name,
            bio: result.profile.bio || '',
            location: result.profile.location || ''
          });
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        setError('Failed to fetch profile');
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.profile);
        setIsEditing(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Failed to update profile');
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SideNavigation />
      
      <main className="flex-grow bg-gray-100 p-8 ml-64">
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center space-x-6 mb-6">
            <Image 
              src={session?.user?.image || '/default-avatar.png'}
              alt="Profile Picture"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.name}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bio</h2>
                <p className="text-gray-600">
                  {profile.bio || 'No bio available'}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                <p className="text-gray-600">
                  {profile.location || 'Not specified'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-md">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Public Repositories
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600">
                    {profile.publicRepositoriesCount}
                  </p>
                </div>

                <div className="bg-gray-100 p-4 rounded-md">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Private Repositories
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600">
                    {profile.privateRepositoriesCount}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
