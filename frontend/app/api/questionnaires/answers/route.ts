import { NextRequest, NextResponse } from 'next/server';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway';

// Helper function to execute database queries
async function executeQuery(query: string, params: any[] = []) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    const result = await client.query(query, params);
    return result;
  } finally {
    await client.end();
  }
}

// Helper function to convert vendor UUID to INTEGER vendor_id
async function getVendorIdFromUuid(vendorUuid: string): Promise<number | null> {
  try {
    // Check if it's already a number
    if (/^\d+$/.test(vendorUuid)) {
      return parseInt(vendorUuid);
    }
    
    // Convert UUID to vendor_id (INTEGER)
    const result = await executeQuery(
      'SELECT vendor_id FROM vendors WHERE uuid = $1',
      [vendorUuid]
    );
    
    if (result.rows.length === 0) {
      console.error(`Vendor not found for UUID: ${vendorUuid}`);
      return null;
    }
    
    return result.rows[0].vendor_id;
  } catch (error) {
    console.error('Error converting vendor UUID to ID:', error);
    return null;
  }
}

// GET - Get all questionnaire answers for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorUuid = searchParams.get('vendorId');
    
    if (!vendorUuid) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Convert UUID to INTEGER vendor_id
    const vendorId = await getVendorIdFromUuid(vendorUuid);
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const query = `
      SELECT 
        id,
        vendor_id,
        question_id,
        question,
        answer,
        status,
        question_title,
        created_at,
        updated_at
      FROM vendor_questionnaire_answers 
      WHERE vendor_id = $1 
      AND question != '__QUESTIONNAIRE_TITLE__'
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query, [vendorId]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching questionnaire answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire answers' },
      { status: 500 }
    );
  }
}

// POST - Save or update a questionnaire answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId: vendorUuid, questionId, question, answer, status, questionTitle } = body;

    if (!vendorUuid || !questionId || !question || !answer) {
      return NextResponse.json(
        { error: 'Vendor ID, question ID, question text, and answer are required' },
        { status: 400 }
      );
    }

    // Convert UUID to INTEGER vendor_id
    const vendorId = await getVendorIdFromUuid(vendorUuid);
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Insert or update the answer
    const query = `
      INSERT INTO vendor_questionnaire_answers (
        id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
      )
      ON CONFLICT (vendor_id, question_id) DO UPDATE SET
        answer = EXCLUDED.answer,
        status = EXCLUDED.status,
        question = EXCLUDED.question,
        question_title = EXCLUDED.question_title,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await executeQuery(query, [
      vendorId,
      questionId,
      question,
      answer,
      status || 'In Progress',
      questionTitle || 'Questionnaire'
    ]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving questionnaire answer:', error);
    return NextResponse.json(
      { error: 'Failed to save questionnaire answer' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific questionnaire answer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, answer, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Answer ID is required' }, { status: 400 });
    }

    const query = `
      UPDATE vendor_questionnaire_answers 
      SET answer = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await executeQuery(query, [answer, status, id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating questionnaire answer:', error);
    return NextResponse.json(
      { error: 'Failed to update questionnaire answer' },
      { status: 500 }
    );
  }
} 