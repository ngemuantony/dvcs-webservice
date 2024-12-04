import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GET /api/repositories/[owner]/[repo]/webhooks
export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repository = await prisma.repository.findFirst({
      where: {
        name: params.repo,
        owner: {
          email: params.owner
        }
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Ensure only repository owner can view webhooks
    if (repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: {
        repositoryId: repository.id
      },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        lastDelivery: true,
        lastStatus: true
      }
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST /api/repositories/[owner]/[repo]/webhooks
export async function POST(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url, events, active = true } = await request.json();

    // Validate input
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid webhook configuration' }, 
        { status: 400 }
      );
    }

    const repository = await prisma.repository.findFirst({
      where: {
        name: params.repo,
        owner: {
          email: params.owner
        }
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Ensure only repository owner can create webhooks
    if (repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        active,
        secret,
        repository: {
          connect: {
            id: repository.id
          }
        }
      }
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Failed to create webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}

// DELETE /api/repositories/[owner]/[repo]/webhooks/[webhookId]
export async function DELETE(
  request: Request,
  { params }: { params: { owner: string; repo: string; webhookId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repository = await prisma.repository.findFirst({
      where: {
        name: params.repo,
        owner: {
          email: params.owner
        }
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Ensure only repository owner can delete webhooks
    if (repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete webhook
    await prisma.webhook.delete({
      where: {
        id: params.webhookId,
        repositoryId: repository.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
