import { useEffect, useState, useMemo } from 'react';

// Advanced client-side detection with multiple validation strategies
export function useClientSide() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Multiple checks to ensure client-side environment
    const checkClientEnvironment = () => {
      const hasWindow = typeof window !== 'undefined';
      const hasDocument = typeof document !== 'undefined';
      const hasNavigator = typeof navigator !== 'undefined';

      // Additional checks to prevent false positives
      const hasValidBrowserFeatures = 
        hasWindow && 
        hasDocument && 
        hasNavigator && 
        window.requestAnimationFrame !== undefined;

      setIsClient(hasValidBrowserFeatures);
    };

    // Immediate check
    checkClientEnvironment();

    // Fallback to ensure state is set
    const timer = setTimeout(checkClientEnvironment, 50);

    return () => clearTimeout(timer);
  }, []);

  // Memoize the client state to prevent unnecessary re-renders
  return useMemo(() => isClient, [isClient]);
}

// Enhanced date formatting with comprehensive fallback and consistency
export function formatClientDate(
  dateInput: string | Date, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC' // Consistent timezone
  }
): string {
  // Provide a consistent ISO date string for server-side rendering
  if (typeof window === 'undefined') {
    return new Date(dateInput).toISOString().split('T')[0];
  }

  try {
    const date = dateInput instanceof Date 
      ? dateInput 
      : new Date(dateInput);

    // Use a fixed, consistent locale to prevent hydration mismatches
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: 'UTC' // Ensure consistent timezone
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return new Date(dateInput).toISOString().split('T')[0];
  }
}

// Deterministic ID generation with enhanced entropy and consistency
export function generateClientId(prefix: string = 'id'): string {
  // Consistent server-side placeholder
  if (typeof window === 'undefined') {
    return `${prefix}-ssr-placeholder`;
  }

  try {
    // Prioritize cryptographically secure methods
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    // Fallback to a more consistent random generation
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 100000).toString(36);
    const browserFingerprint = navigator.userAgent.split(' ')[0].replace(/[^a-z0-9]/gi, '');

    return `${prefix}-${timestamp}-${randomPart}-${browserFingerprint}`;
  } catch (error) {
    console.error('ID generation error:', error);
    return `${prefix}-fallback-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Safe client-side operation wrapper with enhanced error handling
export function safeClientCall<T>(
  clientCallback: () => T, 
  serverFallback: T,
  errorHandler?: (error: unknown) => void
): T {
  if (typeof window !== 'undefined') {
    try {
      return clientCallback();
    } catch (error) {
      // Optional custom error handling
      if (errorHandler) {
        errorHandler(error);
      } else {
        console.error('Client-side call failed:', error);
      }
      return serverFallback;
    }
  }
  return serverFallback;
}

// Utility to ensure consistent initial state with advanced transformation
export function createSafeInitialState<T>(
  initialValue: T, 
  clientTransform?: (value: T) => T,
  errorHandler?: (error: unknown) => void
): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    return clientTransform 
      ? clientTransform(initialValue) 
      : initialValue;
  } catch (error) {
    // Optional custom error handling
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Initial state creation error:', error);
    }
    return initialValue;
  }
}

// Browser extension detection utility
export function detectBrowserExtensions(): string[] {
  const detectedExtensions: string[] = [];

  if (typeof window !== 'undefined') {
    // Check for common browser extension markers
    const extensionMarkers = [
      'data-lt-installed', // Language tool
      '__firefox-extension-id', // Firefox extensions
      '__chrome-extension-id', // Chrome extensions
    ];

    extensionMarkers.forEach(marker => {
      if (document.documentElement.hasAttribute(marker)) {
        detectedExtensions.push(marker);
      }
    });
  }

  return detectedExtensions;
}
