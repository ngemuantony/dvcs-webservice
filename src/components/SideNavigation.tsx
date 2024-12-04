'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  FaHome, 
  FaBook, 
  FaUsers, 
  FaUserCircle, 
  FaKey, 
  FaCog, 
  FaSignOutAlt 
} from 'react-icons/fa';

const NAV_ITEMS = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: FaHome 
  },
  { 
    name: 'Repositories', 
    href: '/repositories', 
    icon: FaBook 
  },
  { 
    name: 'Collaborations', 
    href: '/collaborations', 
    icon: FaUsers 
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: FaUserCircle 
  },
  { 
    name: 'SSH Keys', 
    href: '/ssh-keys', 
    icon: FaKey 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: FaCog 
  }
];

export default function SideNavigation() {
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white p-4 shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">DVCS Platform</h1>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`
                flex items-center p-3 rounded-md transition-colors duration-200
                ${isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <Icon className="mr-3" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center p-3 rounded-md text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200"
        >
          <FaSignOutAlt className="mr-3" />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  );
}
