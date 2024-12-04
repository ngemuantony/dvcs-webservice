import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import * as dvcs from '@/lib/dvcs';
import path from 'path';

const prisma = new PrismaClient();
const REPOS_DIR = process.env.REPOS_DIR || path.join(process.cwd(), 'repositories');

// GET /api/repositories/[owner]/[repo]
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
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        pullRequests: {
          where: {
            status: 'open'
          },
          select: {
            id: true,
            title: true,
            author: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        issues: {
          where: {
            status: 'open'
          },
          select: {
            id: true,
            title: true,
            author: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Check if user has access to private repository
    if (repository.isPrivate && repository.owner.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get repository status from DVCS
    const repoPath = path.join(REPOS_DIR, params.owner, params.repo);
    const [status, branches, commits] = await Promise.all([
      dvcs.getRepositoryStatus(repoPath),
      dvcs.getBranchList(repoPath),
      dvcs.getCommitHistory(repoPath)
    ]);

    return NextResponse.json({
      ...repository,
      status,
      branches,
      commits
    });
  } catch (error) {
    if (error instanceof dvcs.DVCSError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch repository details' }, { status: 500 });
  }
}

// DELETE /api/repositories/[owner]/[repo]
export async function DELETE(
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

    // Only allow repository owner to delete
    if (repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete repository from database
    await prisma.repository.delete({
      where: {
        id: repository.id
      }
    });

    // TODO: Delete repository files from disk
    // This should be done carefully, perhaps with a background job

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
}
