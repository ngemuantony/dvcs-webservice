import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import * as dvcs from '@/lib/dvcs';
import path from 'path';

const prisma = new PrismaClient();
const REPOS_DIR = process.env.REPOS_DIR || path.join(process.cwd(), 'repositories');

// GET /api/repositories/[owner]/[repo]/pulls
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

    // Check if user has access to private repository
    if (repository.isPrivate && repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pullRequests = await prisma.pullRequest.findMany({
      where: {
        repoId: repository.id
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(pullRequests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pull requests' }, { status: 500 });
  }
}

// POST /api/repositories/[owner]/[repo]/pulls
export async function POST(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, sourceBranch, targetBranch } = await request.json();

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

    // Create pull request in database
    const pullRequest = await prisma.pullRequest.create({
      data: {
        title,
        description,
        sourceBranch,
        targetBranch,
        repository: {
          connect: {
            id: repository.id
          }
        },
        author: {
          connect: {
            id: session.user.id
          }
        }
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(pullRequest);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create pull request' }, { status: 500 });
  }
}
