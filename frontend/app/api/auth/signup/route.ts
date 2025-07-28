import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { isValidRole, ROLE_DISPLAY_NAMES } from '@/lib/auth/roles';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway",
  ssl: {
    rejectUnauthorized: false
  }
});

// JWT secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'garnet-ai-super-secret-jwt-key-2025-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, organization, couponCode } = body;

    // Make a request to the backend API instead of handling directly
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    
    const response = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name,
        role,
        organization,
        couponCode, // Pass through the coupon code
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Frontend signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 