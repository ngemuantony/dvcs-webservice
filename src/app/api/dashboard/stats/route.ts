import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const [
      totalRepositories, 
      publicRepositories, 
      privateRepositories,
      collaborations,
      pullRequests,
      issues
    ] = await Promise.all([
      prisma.repository.count({
        where: { ownerId: session.user.id }
      }),
      prisma.repository.count({
        where: { 
          ownerId: session.user.id,
          isPrivate: false 
        }
      }),
      prisma.repository.count({
        where: { 
          ownerId: session.user.id,
          isPrivate: true 
        }
      }),
      prisma.collaboration.count({
        where: { 
          userId: session.user.id,
          status: 'ACCEPTED' 
        }
      }),
      prisma.pullRequest.count({
        where: { 
          authorId: session.user.id 
        }
      }),
      prisma.issue.count({
        where: { 
          authorId: session.user.id 
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalRepositories,
        publicRepositories,
        privateRepositories,
        collaborations,
        pullRequests,
        issues
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
