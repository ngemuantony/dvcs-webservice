'use client';

import { useState, useEffect } from 'react';
import Button from './ui/Button';
import { 
  formatClientDate, 
  useClientSide, 
  generateClientId,
  createSafeInitialState
} from '@/lib/client-utils';

// Webhook event types matching our previous implementation
const WEBHOOK_EVENTS = [
  { 
    key: 'push', 
    label: 'Repository Pushes', 
    description: 'Triggered when code is pushed to the repository' 
  },
  { 
    key: 'pull_request', 
    label: 'Pull Requests', 
    description: 'Triggered on pull request creation, updates, or merges' 
  },
  { 
    key: 'issue', 
    label: 'Issues', 
    description: 'Triggered when issues are created, updated, or closed' 
  },
  { 
    key: 'comment', 
    label: 'Comments', 
    description: 'Triggered when comments are added to pull requests or issues' 
  },
  { 
    key: 'release', 
    label: 'Releases', 
    description: 'Triggered when new releases are created' 
  },
  { 
    key: 'branch', 
    label: 'Branch Changes', 
    description: 'Triggered on branch creation, deletion, or renaming' 
  }
];

interface Webhook {
  id: string;
  url: string;
  events: string;
  active: boolean;
  lastDelivery?: string;
  lastStatus?: string;
}

interface WebhookConfigurationProps {
  repositoryOwner: string;
  repositoryName: string;
}

export default function WebhookConfiguration({ 
  repositoryOwner, 
  repositoryName 
}: WebhookConfigurationProps) {
  const isClient = useClientSide();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  
  // Use safe initial state creation
  const [newWebhook, setNewWebhook] = useState(() => 
    createSafeInitialState({
      id: generateClientId('webhook'),
      url: '',
      events: '',
      active: true
    })
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isClient) {
      fetchWebhooks();
    }
  }, [isClient]);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/${repositoryOwner}/${repositoryName}/webhooks`);
      if (!response.ok) {
        throw new Error('Failed to fetch webhooks');
      }
      const data = await response.json();
      setWebhooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newWebhook.url || !newWebhook.events) {
      setError('Please provide a URL and select at least one event');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/${repositoryOwner}/${repositoryName}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newWebhook,
          id: generateClientId('webhook'), // Ensure unique ID
          // Ensure events is a comma-separated string
          events: newWebhook.events
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create webhook');
      }

      const createdWebhook = await response.json();
      setWebhooks(prev => [...prev, createdWebhook]);
      
      // Reset form
      setNewWebhook(prev => ({
        id: generateClientId('webhook'),
        url: '',
        events: '',
        active: true
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (isClient && !window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/repositories/${repositoryOwner}/${repositoryName}/webhooks/${webhookId}`, 
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete webhook');
      }

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEventSelection = (event: string) => {
    setNewWebhook(prev => {
      const currentEvents = prev.events.split(',').filter(e => e.trim() !== '');
      const newEvents = currentEvents.includes(event)
        ? currentEvents.filter(e => e !== event)
        : [...currentEvents, event];
      
      return {
        ...prev,
        events: newEvents.join(',')
      };
    });
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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Webhook Configuration</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Webhook Creation Form */}
      <form onSubmit={createWebhook} className="mb-6">
        <div className="mb-4">
          <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
            Webhook URL
          </label>
          <input
            type="url"
            id="webhookUrl"
            value={newWebhook.url}
            onChange={(e) => setNewWebhook(prev => ({...prev, url: e.target.value}))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
            placeholder="https://example.com/webhook"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Events
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <div key={event.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={`event-${event.key}`}
                  checked={newWebhook.events.split(',').includes(event.key)}
                  onChange={() => toggleEventSelection(event.key)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label 
                  htmlFor={`event-${event.key}`} 
                  className="ml-2 block text-sm text-gray-900"
                >
                  {event.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isLoading}
        >
          Create Webhook
        </Button>
      </form>

      {/* Existing Webhooks List */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Existing Webhooks</h3>
        {webhooks.length === 0 ? (
          <div className="text-center text-gray-500">
            No webhooks configured for this repository
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div 
                key={webhook.id} 
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">{webhook.url}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {webhook.events.split(',').map((event) => {
                      const eventDetails = WEBHOOK_EVENTS.find(e => e.key === event.trim());
                      return (
                        <span 
                          key={event} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {eventDetails?.label || event}
                        </span>
                      );
                    })}
                  </div>
                  {webhook.lastDelivery && (
                    <div className="mt-2 text-sm text-gray-600">
                      Last delivery: {formatClientDate(webhook.lastDelivery)}
                      <span 
                        className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          webhook.lastStatus === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {webhook.lastStatus}
                      </span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deleteWebhook(webhook.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
