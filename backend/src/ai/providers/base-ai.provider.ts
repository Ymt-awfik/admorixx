/**
 * Base AI Provider Interface
 * All AI providers must implement this interface for consistency
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean; // Force JSON output
  stopSequences?: string[];
}

export interface AICompletionResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface StructuredAIResponse<T = any> {
  data: T;
  raw: string;
  confidence?: number;
}

export abstract class BaseAIProvider {
  abstract readonly provider: string;
  abstract readonly model: string;

  /**
   * Generate text completion
   */
  abstract completion(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse>;

  /**
   * Generate structured JSON output
   * This is the PRIMARY method for all AI operations in this platform
   * AI NEVER makes decisions - only provides explanations and suggestions
   */
  abstract structuredCompletion<T = any>(
    prompt: string,
    schema: any,
    options?: AICompletionOptions,
  ): Promise<StructuredAIResponse<T>>;

  /**
   * Validate that AI output matches expected schema
   */
  protected validateSchema(data: any, schema: any): boolean {
    // Basic schema validation
    // In production, use a library like Zod or Joi
    return true;
  }

  /**
   * Parse JSON from AI response
   */
  protected parseJSON<T>(content: string): T {
    try {
      // Remove markdown code blocks if present
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      throw new Error(`Failed to parse AI JSON response: ${error.message}`);
    }
  }
}
