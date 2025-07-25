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
    const { email, password, full_name, role, organization } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    if (!isValidRole(role)) {
      const validRoles = Object.values(ROLE_DISPLAY_NAMES).join(' or ');
      return NextResponse.json(
        { error: `Role must be either ${validRoles}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if user already exists
      const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
      const existingUserResult = await client.query(existingUserQuery, [email.toLowerCase()]);

      if (existingUserResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Set up 7-day free trial
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + 7); // 7 days from now

      // Insert new user with trial information
      const insertUserQuery = `
        INSERT INTO users (
          email, password_hash, full_name, role, organization, 
          trial_start_date, trial_end_date, is_on_trial, subscription_plan, subscription_status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, full_name, role, organization, trial_start_date, trial_end_date, is_on_trial, created_at
      `;

      const insertResult = await client.query(insertUserQuery, [
        email.toLowerCase(),
        hashedPassword,
        full_name,
        role,
        organization || null,
        trialStartDate, // trial_start_date
        trialEndDate,   // trial_end_date
        true,           // is_on_trial
        'starter',      // subscription_plan
        'trial'         // subscription_status
      ]);

      const user = insertResult.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return success response
      return NextResponse.json({
        message: 'Successfully signed up with 7-day free trial!',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization: user.organization,
          trial_start_date: user.trial_start_date,
          trial_end_date: user.trial_end_date,
          is_on_trial: user.is_on_trial,
          created_at: user.created_at
        }
      }, { status: 201 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 