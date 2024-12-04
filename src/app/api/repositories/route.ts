import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import * as dvcs from '@/lib/dvcs';
import path from 'path';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/repositories
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ 
      success: false,
      error: 'Unauthorized',
      repositories: null 
    }, { status: 401 });
  }

  try {
    const repositories = await prisma.repository.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { isPrivate: false }
        ]
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      error: null,
      repositories: repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        isPrivate: repo.isPrivate,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        owner: {
          name: repo.owner.name,
          email: repo.owner.email
        }
      }))
    });
  } catch (error) {
    console.error('Repositories fetch error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch repositories',
      repositories: null 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/repositories
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ 
      success: false,
      error: 'Unauthorized',
      repository: null 
    }, { status: 401 });
  }

  try {
    const { name, description, isPrivate } = await request.json();

    // Validate repository name
    if (!name || !/^[a-zA-Z0-9-_]+$/.test(name)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid repository name',
        repository: null 
      }, { status: 400 });
    }

    // Check if repository already exists
    const existingRepo = await prisma.repository.findUnique({
      where: {
        ownerId_name: {
          ownerId: session.user.id,
          name: name
        }
      }
    });

    if (existingRepo) {
      return NextResponse.json({ 
        success: false,
        error: 'Repository with this name already exists',
        repository: null 
      }, { status: 400 });
    }

    // Create new repository
    const newRepository = await prisma.repository.create({
      data: {
        name,
        description,
        isPrivate: isPrivate || false,
        ownerId: session.user.id
      }
    });

    // Create repository on filesystem
    const repoPath = path.join(process.env.REPOS_DIR || './repositories', session.user.id, name);
    await dvcs.initRepository(repoPath);

    return NextResponse.json({ 
      success: true,
      error: null,
      repository: {
        id: newRepository.id,
        name: newRepository.name,
        description: newRepository.description,
        isPrivate: newRepository.isPrivate
      }
    });
  } catch (error) {
    console.error('Repository creation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create repository',
      repository: null 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
