import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const extensionsData = formData.get('extensions');

    if (!extensionsData) {
      return NextResponse.json({ error: 'No extension data provided' }, { status: 400 });
    }

    // Prepare log file path
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'browser-extensions.log');

    // Ensure log directory exists
    await import('fs').then(fs => {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    });

    // Log extension details with timestamp
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      extensions: extensionsData,
      userAgent: request.headers.get('user-agent') || 'Unknown'
    }) + '\n';

    // Append to log file
    await writeFile(logFile, logEntry, { flag: 'a' });

    return NextResponse.json({ 
      message: 'Extension data logged successfully',
      status: 'success'
    });
  } catch (error) {
    console.error('Extension telemetry error:', error);
    return NextResponse.json({ 
      error: 'Failed to process extension telemetry', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
