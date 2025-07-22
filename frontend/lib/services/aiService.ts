import { apiClient } from './api';

export interface GenerateDocumentRequest {
  documentTitle: string;
  instructions?: string;
  category?: string;
  vendorId?: number;
  questionId?: string;
}

export interface GenerateDocumentFromTemplateRequest {
  template_content: string;
  variables: Record<string, string>;
  output_format: 'PDF';
  output_filename: string;
  vendor_id?: number;
  question_id?: string;
  category?: string;
}

export interface GenerateDocumentWithAIRequest {
  title: string;
  instructions: string;
  vendorId: number;
  category?: string;
  questionId?: string;
}

export interface GenerateDocumentResponse {
  success: boolean;
  document?: any;
  error?: string;
  downloadUrl?: string;
  documentId?: string;
}

/**
 * AI Service for document generation and other AI-related operations
 */
export class AIService {
  /**
   * Generate and save a supporting document using AI
   */
  static async generateAndSaveDocument(request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> {
    try {
      const response = await apiClient.post<GenerateDocumentResponse>('/api/ai/generate-and-save-document', request);
      return response;
    } catch (error: any) {
      console.error('Error generating document:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate document'
      };
    }
  }

  /**
   * Generate a document preview (without saving)
   */
  static async generateDocumentPreview(request: GenerateDocumentRequest): Promise<{ success: boolean; title: string; content: string; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; title: string; content: string; error?: string }>('/api/ai/generate-document', request);
      return response;
    } catch (error: any) {
      console.error('Error generating document preview:', error);
      return {
        success: false,
        title: '',
        content: '',
        error: error.message || 'Failed to generate document preview'
      };
    }
  }

  /**
   * Generate professional PDF document from template with placeholder replacement
   */
  static async generateDocumentFromTemplate(request: GenerateDocumentFromTemplateRequest): Promise<GenerateDocumentResponse> {
    try {
      const response = await apiClient.post<GenerateDocumentResponse>('/api/ai/generate-document', request);
      return response;
    } catch (error: any) {
      console.error('Error generating document from template:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate document from template'
      };
    }
  }

  /**
   * Generate document using AI with enhanced context and templates
   */
  static async generateDocumentWithAI(request: GenerateDocumentWithAIRequest): Promise<GenerateDocumentResponse> {
    try {
      const response = await apiClient.post<GenerateDocumentResponse>('/api/ai/generate-document-with-ai', request);
      return response;
    } catch (error: any) {
      console.error('Error generating document with AI:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate document with AI'
      };
    }
  }

  /**
   * Helper method to generate documents with predefined templates
   */
  static async generatePolicyDocument(
    documentType: string,
    companyName: string,
    vendorId: number,
    additionalVariables: Record<string, string> = {}
  ): Promise<GenerateDocumentResponse> {
    const templates = {
      'breach_notification': `
BREACH NOTIFICATION POLICY

Company: {{Company_Name}}
Effective Date: {{Effective_Date}}

1. PURPOSE AND SCOPE
This policy establishes procedures for {{Company_Name}} to respond to security incidents and data breaches in accordance with applicable laws and regulations.

2. DEFINITIONS
- Security Incident: Any actual or suspected unauthorized access, use, disclosure, modification, or destruction of information
- Data Breach: A security incident that results in the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data

3. INCIDENT RESPONSE TEAM
{{Company_Name}} maintains an incident response team led by {{CEO}} and including:
- Information Security Officer
- Legal Counsel
- Communications Manager
- Technical Response Team

4. DETECTION AND ASSESSMENT
All suspected security incidents must be reported immediately to security@{{Company_Name}}.com or through our incident portal at {{Policy_Portal}}.

5. NOTIFICATION PROCEDURES
Upon confirmation of a data breach, {{Company_Name}} will:
- Notify affected individuals within 72 hours
- Report to relevant regulatory authorities as required
- Coordinate with law enforcement if criminal activity is suspected

6. DOCUMENTATION AND REVIEW
All incidents are documented and reviewed quarterly to improve our security posture.

Contact: {{Contact_Email}}
Last Updated: {{Current_Date}}
`,
      'kyc_policy': `
KNOW YOUR CUSTOMER (KYC) POLICY

{{Company_Name}}
Effective Date: {{Effective_Date}}

1. POLICY STATEMENT
{{Company_Name}} is committed to maintaining the highest standards of anti-money laundering (AML) and counter-terrorist financing (CTF) compliance.

2. CUSTOMER IDENTIFICATION
Prior to establishing any business relationship, {{Company_Name}} will:
- Verify customer identity using reliable documentation
- Conduct enhanced due diligence for high-risk customers
- Maintain updated customer information

3. ONGOING MONITORING
{{Company_Name}} continuously monitors customer transactions for:
- Unusual transaction patterns
- Sanctions list matches
- Politically exposed persons (PEP) status

4. RECORD KEEPING
All KYC documentation is maintained for a minimum of 5 years and includes:
- Customer identification documents
- Transaction records
- Risk assessment documentation

5. TRAINING AND COMPLIANCE
All staff receive regular AML/KYC training and certification.

For questions, contact our compliance team at compliance@{{Company_Name}}.com

Chief Compliance Officer: {{CEO}}
Policy Portal: {{Policy_Portal}}
Last Review: {{Current_Date}}
`,
      'data_subject_rights': `
DATA SUBJECT RIGHTS POLICY

{{Company_Name}} - Data Protection Compliance
Effective Date: {{Effective_Date}}

1. COMMITMENT TO PRIVACY
{{Company_Name}} respects the privacy rights of all individuals and is committed to protecting personal data in accordance with applicable privacy laws.

2. YOUR RIGHTS
Under applicable data protection laws, you have the following rights:
- Right to access your personal data
- Right to rectification of inaccurate data
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object to processing

3. EXERCISING YOUR RIGHTS
To exercise any of these rights, please contact us at:
- Email: privacy@{{Company_Name}}.com
- Portal: {{Policy_Portal}}/privacy-requests
- Mail: {{Company_Name}} Privacy Team, [Company Address]

4. RESPONSE TIMEFRAMES
{{Company_Name}} will respond to your request within:
- 30 days for standard requests
- 90 days for complex requests (with notification)

5. VERIFICATION PROCESS
To protect your privacy, we may need to verify your identity before processing your request.

6. COMPLAINTS
If you have concerns about our data processing, you may contact our Data Protection Officer at dpo@{{Company_Name}}.com or lodge a complaint with your local supervisory authority.

Data Protection Officer: {{CEO}}
Last Updated: {{Current_Date}}
`
    };

    const template = templates[documentType as keyof typeof templates];
    if (!template) {
      return {
        success: false,
        error: `Unknown document type: ${documentType}. Available types: ${Object.keys(templates).join(', ')}`
      };
    }

    const today = new Date();
    const variables = {
      Company_Name: companyName,
      Effective_Date: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      CEO: 'Chief Executive Officer',
      Policy_Portal: `https://portal.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      Contact_Email: `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      Current_Date: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      ...additionalVariables
    };

    const filename = `${documentType}_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${today.toISOString().split('T')[0].replace(/-/g, '')}.pdf`;

    return await this.generateDocumentFromTemplate({
      template_content: template,
      variables,
      output_format: 'PDF',
      output_filename: filename,
      vendor_id: vendorId,
      category: 'Policy Document'
    });
  }
} 