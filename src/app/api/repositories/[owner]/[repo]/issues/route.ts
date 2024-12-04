import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/repositories/[owner]/[repo]/issues
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

    const issues = await prisma.issue.findMany({
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

    return NextResponse.json(issues);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

// POST /api/repositories/[owner]/[repo]/issues
export async function POST(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description } = await request.json();

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

    // Create issue in database
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
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

    return NextResponse.json(issue);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}

// PATCH /api/repositories/[owner]/[repo]/issues
export async function PATCH(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { issueId, status } = await request.json();

    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId
      },
      include: {
        repository: true
      }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Only allow repository owner or issue author to update status
    if (issue.repository.ownerId !== session.user.id && issue.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedIssue = await prisma.issue.update({
      where: {
        id: issueId
      },
      data: {
        status
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

    return NextResponse.json(updatedIssue);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}
