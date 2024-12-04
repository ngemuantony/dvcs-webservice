import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const { name, email, password } = JSON.parse(body);

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          data: null 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      
      // Check if it's a database connection or table not found error
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 is unique constraint violation
        // P2025 is record not found
        // P1001 is database connection error
        // P1003 is table not found
        return NextResponse.json(
          { 
            success: false,
            error: `Database error: ${dbError.code}. Please ensure your database is set up correctly.`,
            data: null 
          },
          { status: 500 }
        );
      }
      
      throw dbError;
    }

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User already exists',
          data: null 
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    // Remove password from response
    const { hashedPassword: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      error: null,
      data: userWithoutPassword
    });
  } catch (error) {
    // Improved error handling with type checking
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Something went wrong during signup';

    // Log the full error for debugging
    console.error('Signup error details:', {
      errorType: typeof error,
      errorString: String(error),
      errorMessage
    });

    // Ensure a proper error response
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        data: null
      },
      { status: 500 }
    );
  } finally {
    // Always disconnect to prevent connection leaks
    await prisma.$disconnect();
  }
}
