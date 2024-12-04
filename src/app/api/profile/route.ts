import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        name: true,
        email: true,
        bio: true,
        location: true,
        _count: {
          select: {
            repositories: {
              where: { isPrivate: false }
            },
            repositories: {
              where: { isPrivate: true }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        publicRepositoriesCount: user._count.repositories[0],
        privateRepositoriesCount: user._count.repositories[1]
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { name, bio, location } = await req.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name is required' 
      }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        name,
        bio: bio?.trim() || null,
        location: location?.trim() || null
      },
      select: {
        name: true,
        email: true,
        bio: true,
        location: true,
        _count: {
          select: {
            repositories: {
              where: { isPrivate: false }
            },
            repositories: {
              where: { isPrivate: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      profile: {
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        location: updatedUser.location,
        publicRepositoriesCount: updatedUser._count.repositories[0],
        privateRepositoriesCount: updatedUser._count.repositories[1]
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
