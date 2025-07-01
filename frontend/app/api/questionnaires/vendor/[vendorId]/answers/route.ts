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

// GET - Get all questionnaire answers for a specific vendor
export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorUuid = params.vendorId;
    
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
    console.error('Error fetching vendor questionnaire answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor questionnaire answers' },
      { status: 500 }
    );
  }
} 