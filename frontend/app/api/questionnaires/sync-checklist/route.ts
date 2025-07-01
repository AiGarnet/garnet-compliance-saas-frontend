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

// POST - Sync checklist questions to questionnaire answers table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId: vendorUuid, checklistId } = body;

    if (!vendorUuid) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Convert UUID to INTEGER vendor_id
    const vendorId = await getVendorIdFromUuid(vendorUuid);
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    let whereClause = 'WHERE cq.vendor_id = $1';
    let params = [vendorUuid]; // Use UUID for checklist_questions table

    if (checklistId) {
      whereClause += ' AND cq.checklist_id = $2';
      params.push(checklistId);
    }

    // Get checklist questions with AI answers
    const questionsQuery = `
      SELECT 
        cq.id,
        cq.checklist_id,
        cq.question_text,
        cq.ai_answer,
        cq.status,
        cq.confidence_score,
        c.name as checklist_name
      FROM checklist_questions cq
      INNER JOIN checklists c ON cq.checklist_id = c.id
      ${whereClause}
      ORDER BY cq.question_order
    `;

    const questionsResult = await executeQuery(questionsQuery, params);
    
    if (questionsResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'No checklist questions found to sync', syncedCount: 0 }
      );
    }

    let syncedCount = 0;
    const errors = [];

    // Sync each question to vendor_questionnaire_answers
    for (const question of questionsResult.rows) {
      try {
        // Map status from checklist to questionnaire format
        let questionnaireStatus = 'Pending';
        if (question.status === 'completed' && question.ai_answer) {
          questionnaireStatus = 'Completed';
        } else if (question.status === 'in-progress') {
          questionnaireStatus = 'In Progress';
        } else if (question.status === 'needs-support') {
          questionnaireStatus = 'Needs Support';
        }

        const syncQuery = `
          INSERT INTO vendor_questionnaire_answers (
            id, vendor_id, question_id, question, answer, status, question_title, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
          )
          ON CONFLICT (vendor_id, question_id) DO UPDATE SET
            question = EXCLUDED.question,
            answer = EXCLUDED.answer,
            status = EXCLUDED.status,
            question_title = EXCLUDED.question_title,
            updated_at = NOW()
          RETURNING id
        `;

        await executeQuery(syncQuery, [
          vendorId, // INTEGER vendor_id for questionnaire table
          question.id, // Use checklist question ID as question_id
          question.question_text,
          question.ai_answer || '',
          questionnaireStatus,
          question.checklist_name
        ]);

        syncedCount++;
      } catch (error: any) {
        console.error(`Error syncing question ${question.id}:`, error);
        errors.push(`Question ${question.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Successfully synced ${syncedCount} questions to questionnaire system`,
      syncedCount,
      totalQuestions: questionsResult.rows.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error syncing checklist to questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to sync checklist to questionnaire system' },
      { status: 500 }
    );
  }
} 