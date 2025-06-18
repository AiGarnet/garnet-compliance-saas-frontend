const fs = require('fs');
const path = require('path');

// Load the compliance data
let complianceData = [];
try {
  // Path is relative to the function's directory, need to go up to find public folder
  const dataPath = path.join(__dirname, '../../public/data_new.json');
  
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    complianceData = JSON.parse(rawData);
    console.log(`Loaded ${complianceData.length} compliance records`);
  } else {
    console.error(`Data file not found at ${dataPath}`);
  }
} catch (error) {
  console.error('Error loading compliance data:', error);
}

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const { question } = JSON.parse(event.body);
    
    if (!question) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    // Find relevant data based on the question
    const relevantData = findRelevantComplianceData(question, complianceData);
    
    // Generate answer from the relevant data
    const answer = generateAnswer(question, relevantData);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        question, 
        answer,
        timestamp: new Date().toISOString() 
      })
    };
    
  } catch (error) {
    console.error('Error processing question:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: error.message || 'Error processing your question' })
    };
  }
};

// Helper function to find relevant compliance data
function findRelevantComplianceData(question, data) {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Convert question to lowercase for case-insensitive matching
  const questionLower = question.toLowerCase();
  
  // Define common categories and domains to look for
  const categories = [
    'Data Privacy', 'Data Security', 'Cybersecurity', 'Compliance', 
    'Financial Privacy', 'Public Sector Privacy', 'GDPR', 'HIPAA', 'CCPA',
    'Encryption', 'Access Control', 'Audit', 'Authentication', 'Authorization',
    'Data Retention', 'Data Deletion', 'Breach Notification', 'Risk Assessment'
  ];
  
  // Extract key phrases from the question
  const questionPhrases = extractKeyPhrases(questionLower);
  
  // Check if question contains any categories
  const matchedCategories = categories.filter(category => 
    questionLower.includes(category.toLowerCase())
  );
  
  // Score each data item based on relevance to the question
  const scoredData = data.map(item => {
    let score = 0;
    
    // Category matches are highly relevant
    if (matchedCategories.includes(item.category)) {
      score += 10;
    }
    
    // Check for domain matches
    if (item.domains) {
      for (const domain of item.domains) {
        if (questionLower.includes(domain.toLowerCase())) {
          score += 5;
        }
      }
    }
    
    // Check for name matches (e.g., "GDPR", "HIPAA")
    if (questionLower.includes(item.name.toLowerCase())) {
      score += 15;
    }
    
    // Check for jurisdiction matches
    if (questionLower.includes(item.jurisdiction?.toLowerCase() || '')) {
      score += 3;
    }
    
    // Look for specific keyword matches in description and requirements
    const descriptionLower = item.description?.toLowerCase() || '';
    const requirementLower = item.requirement?.toLowerCase() || '';
    
    // Check for phrase matches (more important than single words)
    for (const phrase of questionPhrases) {
      if (descriptionLower.includes(phrase)) {
        score += 3;
      }
      if (requirementLower.includes(phrase)) {
        score += 4; // Requirements are more relevant for answers
      }
    }
    
    // Look for individual word matches
    const questionWords = questionLower.split(/\s+/).filter(word => 
      word.length > 3 && !['what', 'when', 'where', 'which', 'how', 'does', 'your', 'our', 'with'].includes(word)
    );
    
    for (const word of questionWords) {
      if (descriptionLower.includes(word)) {
        score += 1;
      }
      if (requirementLower.includes(word)) {
        score += 2;
      }
    }
    
    return { ...item, relevanceScore: score };
  });
  
  // Filter items with non-zero scores and sort by relevance
  const relevantItems = scoredData
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3); // Limit to top 3 most relevant items
  
  return relevantItems.map(item => {
    const { relevanceScore, ...rest } = item;
    return rest;
  });
}

// Extract meaningful phrases from the question
function extractKeyPhrases(question) {
  const phrases = [];
  
  // Common security/compliance phrases to look for
  const commonPhrases = [
    'data encryption', 'encrypt data', 'at rest', 'in transit',
    'access control', 'multi factor', 'two factor', 'authentication',
    'data retention', 'retain data', 'data deletion', 'delete data',
    'security audit', 'penetration test', 'vulnerability scan',
    'incident response', 'breach notification', 'data processing',
    'privacy policy', 'data protection', 'data transfer', 'cross border',
    'third party', 'vendor management', 'risk assessment',
    'security protocol', 'security policy', 'data classification',
    'data security', 'security controls', 'security measures'
  ];
  
  for (const phrase of commonPhrases) {
    if (question.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  return phrases;
}

// Generate answer from the relevant data as a vendor using comprehensive compliance context
function generateAnswer(question, relevantData) {
  // Build comprehensive compliance context based on Garnet AI research
  let complianceContext = "";
  
  if (relevantData.length > 0) {
    complianceContext = "\n\nRelevant compliance frameworks and requirements:\n";
    relevantData.forEach((item, index) => {
      complianceContext += `${index + 1}. ${item.name} (${item.jurisdiction || 'Global'}):\n`;
      complianceContext += `   Category: ${item.category}\n`;
      complianceContext += `   Description: ${item.description}\n`;
      if (item.requirement) {
        complianceContext += `   Requirements: ${item.requirement}\n`;
      }
      complianceContext += "\n";
    });
  }
  
  // Detect question category for specialized vendor context
  const questionLower = question.toLowerCase();
  let categoryContext = "";
  
  if (questionLower.includes('data') && (questionLower.includes('privacy') || questionLower.includes('protection') || questionLower.includes('gdpr') || questionLower.includes('ccpa'))) {
    categoryContext = "\n\nData Privacy Context: As a vendor, address consent mechanisms (explicit for GDPR, opt-out for CCPA), data processing agreements (DPAs), breach notification procedures (72-hour for EU/UK, immediate for high-risk), data subject rights, cross-border transfers using Standard Contractual Clauses (SCCs), and Data Protection Officer (DPO) arrangements where required.";
  } else if (questionLower.includes('beneficial') || questionLower.includes('ownership') || questionLower.includes('pep') || questionLower.includes('sanctions') || questionLower.includes('aml')) {
    categoryContext = "\n\nFinancial Crime Context: As a vendor, address beneficial ownership disclosure (typically 25% threshold per FATF recommendations), PEP screening using commercial databases, sanctions compliance against OFAC/UN/EU lists, suspicious activity reporting capabilities, and AML/CFT compliance measures including record retention.";
  } else if (questionLower.includes('bribery') || questionLower.includes('corruption') || questionLower.includes('fcpa') || questionLower.includes('facilitation')) {
    categoryContext = "\n\nAnti-Bribery Context: As a vendor, address anti-bribery policies aligned with FCPA and UK Bribery Act, prohibition of facilitation payments (note: FCPA has narrow exception, UK Bribery Act prohibits all), third-party due diligence, adequate procedures, training programs, and whistleblower mechanisms.";
  } else if (questionLower.includes('security') || questionLower.includes('cyber') || questionLower.includes('iso') || questionLower.includes('soc') || questionLower.includes('incident')) {
    categoryContext = "\n\nCybersecurity Context: As a vendor, address information security management systems (ISO 27001), SOC 2 Type II audits, incident response aligned with ISO 27035/NIS2, access controls including multi-factor authentication, encryption (AES-256 at rest, TLS 1.3 in transit), vulnerability management, and business continuity planning.";
  }
  
  // This Netlify function serves as a fallback but the main AI generation 
  // should happen in the backend using the OpenAI API key
  // Return basic contextual response with guidance to use backend API
  return generateFallbackVendorResponse(question, relevantData, categoryContext);
}

// Simplified fallback response for Netlify function
// The main AI generation should use OpenAI API in the backend
function generateFallbackVendorResponse(question, relevantData, categoryContext) {
  const questionLower = question.toLowerCase();
  
  // Build a basic vendor response with compliance context
  let response = "Our organization has implemented comprehensive measures to address this requirement. ";
  
  // Add category-specific context
  if (categoryContext.includes('Data Privacy')) {
    response += "We maintain compliance with data privacy regulations and have established appropriate data handling procedures. ";
  } else if (categoryContext.includes('Financial Crime')) {
    response += "We have implemented financial crime risk management controls including screening and monitoring procedures. ";
  } else if (categoryContext.includes('Anti-Bribery')) {
    response += "We maintain anti-bribery and corruption policies with appropriate due diligence procedures. ";
  } else if (categoryContext.includes('Cybersecurity')) {
    response += "We have established information security controls aligned with industry standards. ";
  }
  
  // Add relevant framework references if available
  if (relevantData.length > 0) {
    const frameworks = relevantData.map(item => item.name).slice(0, 2).join(' and ');
    response += `Our approach aligns with ${frameworks} requirements. `;
  }
  
  response += "We regularly review and update our practices to ensure continued effectiveness and can provide additional documentation upon request.";
  
  return response;
}

function condenseText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Try to break at sentence boundaries
  const sentences = text.split(/[.!?]+/);
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length <= maxLength - 10) { // Leave some buffer
      result += sentence.trim() + '. ';
    } else {
      break;
    }
  }
  
  if (result.length === 0) {
    // If no complete sentences fit, truncate at word boundary
    const words = text.split(/\s+/);
    result = '';
    for (const word of words) {
      if ((result + word).length <= maxLength - 10) {
        result += word + ' ';
      } else {
        break;
      }
    }
    result = result.trim() + '...';
  }
  
  return result.trim();
} 