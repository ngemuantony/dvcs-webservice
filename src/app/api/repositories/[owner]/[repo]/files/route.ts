import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import * as dvcs from '@/lib/dvcs';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();
const REPOS_DIR = process.env.REPOS_DIR || path.join(process.cwd(), 'repositories');

// GET /api/repositories/[owner]/[repo]/files
export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path') || '';
  const branch = searchParams.get('branch') || 'main';

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

    const repoPath = path.join(REPOS_DIR, params.owner, params.repo);

    // Checkout the requested branch
    await dvcs.checkoutBranch(repoPath, branch);

    // Get file or directory contents
    const fullPath = path.join(repoPath, filePath);
    const stats = await fs.stat(fullPath);

    if (stats.isFile()) {
      const content = await dvcs.getFileContents(repoPath, filePath);
      const diff = await dvcs.getFileDiff(repoPath, filePath);
      
      return NextResponse.json({
        type: 'file',
        name: path.basename(filePath),
        path: filePath,
        content,
        diff,
        size: stats.size,
        lastModified: stats.mtime
      });
    } else if (stats.isDirectory()) {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const contents = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path.join(filePath, entry.name);
          const entryStats = await fs.stat(path.join(repoPath, entryPath));
          
          return {
            type: entry.isDirectory() ? 'directory' : 'file',
            name: entry.name,
            path: entryPath,
            size: entryStats.size,
            lastModified: entryStats.mtime
          };
        })
      );

      return NextResponse.json({
        type: 'directory',
        name: path.basename(filePath) || '/',
        path: filePath,
        contents: contents.sort((a, b) => {
          // Directories first, then alphabetically
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === 'directory' ? -1 : 1;
        })
      });
    }

    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  } catch (error) {
    if (error instanceof dvcs.DVCSError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch file contents' }, { status: 500 });
  }
}

// POST /api/repositories/[owner]/[repo]/files
export async function POST(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filePath, content, message } = await request.json();

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

    // Only allow repository owner to modify files
    if (repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repoPath = path.join(REPOS_DIR, params.owner, params.repo);
    const fullPath = path.join(repoPath, filePath);

    // Create directories if they don't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file content
    await fs.writeFile(fullPath, content);

    // Commit changes
    await dvcs.commitChanges(repoPath, message || `Update ${filePath}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof dvcs.DVCSError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
