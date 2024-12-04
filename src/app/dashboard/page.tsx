'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FaCodeBranch, 
  FaProjectDiagram, 
  FaUsers, 
  FaChartBar, 
  FaClipboardList 
} from 'react-icons/fa';

interface DashboardStats {
  totalRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
  collaborations: number;
  pullRequests: number;
  issues: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch dashboard statistics');
        }
      } catch (err) {
        console.error('Dashboard stats fetch error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchDashboardStats();
    } else if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-16 h-16 border-[6px] border-current border-t-transparent text-indigo-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-xl text-gray-700 mt-4">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if unauthenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard Unavailable
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {session?.user?.name || 'Developer'}
              </h1>
              <p className="text-gray-600 mt-2">
                Your development workspace awaits
              </p>
            </div>
            <Link 
              href="/repositories/new" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center"
            >
              <FaCodeBranch className="mr-2" /> New Repository
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Repositories Overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FaProjectDiagram className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Repositories</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalRepositories || 0}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm text-gray-600">Private</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.privateRepositories || 0}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm text-gray-600">Public</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.publicRepositories || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Collaborations */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-green-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Collaborations</h2>
            </div>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm text-gray-600">Active Collaborations</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.collaborations || 0}
              </p>
            </div>
            <div className="mt-4">
              <Link 
                href="/collaborations" 
                className="text-indigo-600 hover:text-indigo-800 transition"
              >
                Manage Collaborations
              </Link>
            </div>
          </div>

          {/* Development Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FaChartBar className="text-blue-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Development</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm text-gray-600">Pull Requests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.pullRequests || 0}
                </p>
              </div>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm text-gray-600">Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.issues || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link 
                href="/pull-requests" 
                className="text-sm text-indigo-600 hover:text-indigo-800 transition"
              >
                View Pull Requests
              </Link>
              <Link 
                href="/issues" 
                className="text-sm text-indigo-600 hover:text-indigo-800 transition"
              >
                View Issues
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/repositories" 
            className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition flex items-center"
          >
            <FaProjectDiagram className="text-indigo-600 text-2xl mr-4" />
            <span className="text-lg font-semibold text-gray-900">
              Manage Repositories
            </span>
          </Link>
          <Link 
            href="/profile" 
            className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition flex items-center"
          >
            <FaUsers className="text-green-600 text-2xl mr-4" />
            <span className="text-lg font-semibold text-gray-900">
              Profile Settings
            </span>
          </Link>
          <Link 
            href="/ssh-keys" 
            className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition flex items-center"
          >
            <FaClipboardList className="text-blue-600 text-2xl mr-4" />
            <span className="text-lg font-semibold text-gray-900">
              SSH Keys
            </span>
          </Link>
          <Link 
            href="/settings" 
            className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition flex items-center"
          >
            <FaChartBar className="text-red-600 text-2xl mr-4" />
            <span className="text-lg font-semibold text-gray-900">
              Account Settings
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
