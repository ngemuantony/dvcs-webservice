'use client';

import { useEffect, useState } from 'react';
import { detectBrowserExtensions } from '@/lib/client-utils';

export default function ClientLayoutWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [hydrationId] = useState(() => {
    // Generate a consistent ID that will be the same on server and client
    return 'hydration-' + Math.floor(Date.now() / 1000 / 60).toString(36);
  });

  useEffect(() => {
    // Detect and log browser extensions
    const detectedExtensions = detectBrowserExtensions();
    
    if (detectedExtensions.length > 0) {
      console.warn('Potential browser extensions detected:', detectedExtensions);
      
      // Optional: Send telemetry or take preventive action
      if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
        const telemetryData = new FormData();
        telemetryData.append('extensions', JSON.stringify(detectedExtensions));
        window.navigator.sendBeacon('/api/telemetry/extensions', telemetryData);
      }
    }
  }, []);

  return (
    <>
      <nav className="bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold">DVCS</a>
              <div className="ml-10 flex items-center space-x-4">
                <a href="/explore" className="hover:text-gray-300">Explore</a>
                <a href="/repositories" className="hover:text-gray-300">Repositories</a>
                <a href="/issues" className="hover:text-gray-300">Issues</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/login" className="hover:text-gray-300">Login</a>
              <a href="/signup" className="bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Use consistent hydration ID */}
      <div data-hydration-id={hydrationId}>
        {children}
      </div>
    </>
  );
}
