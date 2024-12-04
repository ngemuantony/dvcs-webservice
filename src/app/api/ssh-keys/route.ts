import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function generateFingerprint(publicKey: string): string {
  const keyBuffer = Buffer.from(publicKey.trim(), 'base64');
  const hash = crypto.createHash('md5');
  hash.update(keyBuffer);
  return hash.digest('hex');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const sshKeys = await prisma.sshKey.findMany({
      where: { 
        user: { 
          email: session.user.email! 
        } 
      },
      select: {
        id: true,
        title: true,
        fingerprint: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      sshKeys 
    });
  } catch (error) {
    console.error('SSH keys fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { title, publicKey } = await req.json();

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title is required' 
      }, { status: 400 });
    }

    if (!publicKey || !publicKey.includes('ssh-')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid SSH public key' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    const fingerprint = generateFingerprint(publicKey);

    const newSSHKey = await prisma.sshKey.create({
      data: {
        title: title.trim(),
        publicKey: publicKey.trim(),
        fingerprint,
        userId: user!.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      sshKey: newSSHKey 
    }, { status: 201 });
  } catch (error) {
    console.error('SSH key creation error:', error);

    if ((error as any).code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'SSH key already exists' 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json({ 
        success: false, 
        error: 'SSH Key ID is required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    const deletedKey = await prisma.sshKey.deleteMany({
      where: { 
        id: keyId,
        userId: user!.id 
      }
    });

    if (deletedKey.count === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'SSH Key not found or unauthorized' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('SSH key deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
