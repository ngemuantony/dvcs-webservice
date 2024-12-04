import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface WebhookPayload {
  event: string;
  repository: {
    id: string;
    name: string;
    owner: string;
  };
  data: any;
}

// Webhook delivery log model
export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  status: 'pending' | 'success' | 'failed';
  responseCode?: number;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export async function sendWebhook(
  repositoryId: string, 
  event: string, 
  data: any, 
  maxRetries: number = 3
) {
  try {
    // Get all active webhooks for this repository
    const webhooks = await prisma.webhook.findMany({
      where: {
        repositoryId,
        // Convert events to comma-separated string for storage
        events: {
          contains: event
        },
        active: true
      },
      include: {
        repository: true
      }
    });

    // Perform webhook deliveries
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const payload: WebhookPayload = {
          event,
          repository: {
            id: repositoryId,
            name: webhook.repository.name,
            owner: webhook.repository.owner.email
          },
          data
        };

        // Attempt delivery with retry mechanism
        return await deliverWebhookWithRetry(webhook, payload, maxRetries);
      })
    );

    // Log and handle delivery results
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Webhook delivery failed:`, result.reason);
      }
    });

    return results;
  } catch (error) {
    console.error('Error in webhook processing:', error);
    throw error;
  }
}

async function deliverWebhookWithRetry(
  webhook: any, 
  payload: WebhookPayload, 
  maxRetries: number
): Promise<void> {
  let retryCount = 0;
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payload, webhook.secret);

  while (retryCount <= maxRetries) {
    try {
      const startTime = Date.now();
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DVCS-Event': payload.event,
          'X-DVCS-Signature': signature,
          'X-DVCS-Delivery': crypto.randomUUID()
        },
        body: payloadString,
        timeout: 10000 // 10-second timeout
      });

      // Log delivery attempt
      await logWebhookDelivery({
        webhookId: webhook.id,
        event: payload.event,
        payload: payloadString,
        status: response.ok ? 'success' : 'failed',
        responseCode: response.status,
        retryCount
      });

      // Successful delivery
      if (response.ok) {
        // Update webhook last delivery status
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastDelivery: new Date(),
            lastStatus: 'success'
          }
        });
        return;
      }

      // Non-successful response
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    } catch (error) {
      retryCount++;

      // Log failed delivery
      await logWebhookDelivery({
        webhookId: webhook.id,
        event: payload.event,
        payload: payloadString,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount
      });

      // Exponential backoff
      if (retryCount <= maxRetries) {
        const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        // Final failure after max retries
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastDelivery: new Date(),
            lastStatus: 'failed'
          }
        });
        throw error;
      }
    }
  }
}

async function logWebhookDelivery(log: Partial<WebhookDeliveryLog>) {
  try {
    await prisma.webhookDeliveryLog.create({
      data: {
        ...log,
        createdAt: new Date()
      } as any
    });
  } catch (error) {
    console.error('Failed to log webhook delivery:', error);
  }
}

function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// Webhook event types (for type safety and consistency)
export const WebhookEvents = {
  PUSH: 'push',
  PULL_REQUEST: 'pull_request',
  ISSUE: 'issue',
  COMMENT: 'comment',
  RELEASE: 'release',
  BRANCH: 'branch'
} as const;

// Validate webhook payload signature
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(JSON.parse(payload), secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
