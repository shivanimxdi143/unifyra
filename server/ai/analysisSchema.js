/**
 * @file analysisSchema.js
 * @description Structured response schemas and validation helpers for AI brand governance checks.
 * Ensures strict compatibility with the Mongoose Finding model and Gemini API structured output.
 */

/**
 * Valid severity levels strictly aligned with Finding model enum
 * @see server/models/Finding.js
 */
const VALID_SEVERITIES = Object.freeze(['low', 'medium', 'high', 'critical']);

/**
 * Default severity when an unexpected or invalid severity is returned
 */
const DEFAULT_SEVERITY = 'medium';

/**
 * Standard JSON Schema definition for brand compliance analysis response.
 * Adheres to JSON Schema Draft-07.
 */
const ANALYSIS_JSON_SCHEMA = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BrandComplianceAnalysisResult',
  description: 'Structured output format for AI brand compliance evaluation',
  type: 'object',
  required: ['findings'],
  additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      description: 'List of specific brand guideline violations identified in the content',
      items: {
        type: 'object',
        required: ['ruleId', 'severity', 'offendingText', 'explanation', 'suggestedCorrection'],
        additionalProperties: false,
        properties: {
          ruleId: {
            type: ['string', 'null'],
            description: 'The unique _id or identifier of the guideline rule that was violated'
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Severity level: low, medium, high, or critical'
          },
          offendingText: {
            type: 'string',
            description: 'Exact verbatim excerpt from the submitted content that constitutes the violation'
          },
          explanation: {
            type: 'string',
            description: 'Clear explanation of why the excerpt violates the referenced rule'
          },
          suggestedCorrection: {
            type: 'string',
            description: 'Recommended replacement or revision to bring the content into compliance'
          }
        }
      }
    },
    overallComplianceScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Estimated compliance score from 0 (heavily non-compliant) to 100 (fully compliant)'
    },
    summary: {
      type: 'string',
      description: 'Concise executive summary of the brand governance evaluation'
    }
  }
});

/**
 * Gemini API compatible responseSchema object
 * Suitable for passing directly to generationConfig.responseSchema
 * in @google/genai or @google/generative-ai SDKs.
 */
const GEMINI_RESPONSE_SCHEMA = Object.freeze({
  type: 'OBJECT',
  properties: {
    findings: {
      type: 'ARRAY',
      description: 'List of detected brand rule violations. Empty array if content is fully compliant.',
      items: {
        type: 'OBJECT',
        properties: {
          ruleId: {
            type: 'STRING',
            description: 'The ID of the violated brand rule (e.g., MongoDB ObjectId or rule code)'
          },
          severity: {
            type: 'STRING',
            description: 'Violation severity',
            enum: ['low', 'medium', 'high', 'critical']
          },
          offendingText: {
            type: 'STRING',
            description: 'Exact substring from content that breaches brand guidelines'
          },
          explanation: {
            type: 'STRING',
            description: 'Reasoning why this violates the rule'
          },
          suggestedCorrection: {
            type: 'STRING',
            description: 'Brand-compliant revision or rewrite'
          }
        },
        required: ['ruleId', 'severity', 'offendingText', 'explanation', 'suggestedCorrection']
      }
    },
    overallComplianceScore: {
      type: 'INTEGER',
      description: 'Brand compliance score between 0 and 100'
    },
    summary: {
      type: 'STRING',
      description: 'Summary of evaluation findings'
    }
  },
  required: ['findings']
});

/**
 * Validates that an object conforms to the expected AI analysis response format.
 *
 * @param {unknown} data - Parsed JSON object from AI model response
 * @returns {{ isValid: boolean, errors: string[], data: object | null }} Validation outcome
 */
function validateAnalysisResponse(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Response must be a non-null JSON object'],
      data: null
    };
  }

  if (!Array.isArray(data.findings)) {
    errors.push('Response must contain a "findings" array');
  } else {
    data.findings.forEach((finding, index) => {
      if (!finding || typeof finding !== 'object') {
        errors.push(`Finding at index ${index} must be an object`);
        return;
      }

      if (typeof finding.offendingText !== 'string' || !finding.offendingText.trim()) {
        errors.push(`Finding at index ${index} must include non-empty "offendingText"`);
      }

      if (typeof finding.explanation !== 'string' || !finding.explanation.trim()) {
        errors.push(`Finding at index ${index} must include non-empty "explanation"`);
      }

      if (finding.severity && !VALID_SEVERITIES.includes(String(finding.severity).toLowerCase())) {
        errors.push(
          `Finding at index ${index} has invalid severity "${finding.severity}". Must be one of: ${VALID_SEVERITIES.join(', ')}`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : null
  };
}

/**
 * Sanitizes and normalizes an individual finding so it is safely compatible
 * with the Mongoose Finding model schema.
 *
 * Handles:
 * - ObjectId casting compatibility (nullifies non-ObjectId strings so Mongoose doesn't throw CastError)
 * - Severity lowercase normalization and fallback
 * - String trimming
 * - Attaching submissionId
 *
 * @param {object} rawFinding - Raw finding from AI output
 * @param {string|object} submissionId - MongoDB ObjectId of parent Submission
 * @returns {object} Cleaned object ready for Finding.create()
 */
function sanitizeFindingForDb(rawFinding, submissionId) {
  if (!rawFinding || typeof rawFinding !== 'object') {
    throw new Error('rawFinding must be an object');
  }

  // Normalize severity
  let severity = DEFAULT_SEVERITY;
  if (rawFinding.severity) {
    const normalized = String(rawFinding.severity).toLowerCase().trim();
    if (VALID_SEVERITIES.includes(normalized)) {
      severity = normalized;
    }
  }

  // Handle ruleId: Mongoose Finding.ruleId is Schema.Types.ObjectId (default: null).
  // Check if string is a valid 24-character hexadecimal ObjectId
  let ruleId = null;
  if (rawFinding.ruleId) {
    const rawIdStr = String(rawFinding.ruleId).trim();
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(rawIdStr);
    if (isValidObjectId) {
      ruleId = rawIdStr;
    }
  }

  return {
    submissionId,
    ruleId,
    severity,
    offendingText: String(rawFinding.offendingText || '').trim(),
    explanation: String(rawFinding.explanation || '').trim(),
    suggestedCorrection: String(rawFinding.suggestedCorrection || '').trim()
  };
}

module.exports = {
  VALID_SEVERITIES,
  DEFAULT_SEVERITY,
  ANALYSIS_JSON_SCHEMA,
  GEMINI_RESPONSE_SCHEMA,
  validateAnalysisResponse,
  sanitizeFindingForDb
};
