import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  BaseAIProvider,
  AIMessage,
  AICompletionOptions,
  AICompletionResponse,
  StructuredAIResponse,
} from './base-ai.provider';

/**
 * OpenAI Provider Implementation
 * Supports GPT-4 and GPT-3.5 models
 */
@Injectable()
export class OpenAIProvider extends BaseAIProvider {
  readonly provider = 'openai';
  readonly model: string;

  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey: string;
  private readonly client: AxiosInstance;
  private readonly baseURL = 'https://api.openai.com/v1';

  constructor(private configService: ConfigService) {
    super();

    this.apiKey = this.configService.get<string>('AI_API_KEY');
    this.model = this.configService.get<string>('AI_MODEL') || 'gpt-4-turbo-preview';

    if (!this.apiKey) {
      throw new Error('AI_API_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Generate text completion using OpenAI Chat API
   */
  async completion(
    messages: AIMessage[],
    options: AICompletionOptions = {},
  ): Promise<AICompletionResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options.temperature ?? this.configService.get<number>('AI_TEMPERATURE') ?? 0.7,
        max_tokens: options.maxTokens ?? this.configService.get<number>('AI_MAX_TOKENS') ?? 4000,
        ...(options.jsonMode && { response_format: { type: 'json_object' } }),
        ...(options.stopSequences && { stop: options.stopSequences }),
      });

      const choice = response.data.choices[0];

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
        model: response.data.model,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);

      if (error.response?.data) {
        this.logger.error(`OpenAI error details: ${JSON.stringify(error.response.data)}`);
      }

      throw new Error(`OpenAI completion failed: ${error.message}`);
    }
  }

  /**
   * Generate structured JSON completion
   * CRITICAL: This ensures AI outputs are always structured and parseable
   */
  async structuredCompletion<T = any>(
    prompt: string,
    schema: any,
    options: AICompletionOptions = {},
  ): Promise<StructuredAIResponse<T>> {
    const systemPrompt = `You are a precise AI assistant that ONLY outputs valid JSON.
Your response must strictly follow the provided schema.
Do not include any explanatory text outside the JSON structure.
Always output valid, parseable JSON.`;

    const userPrompt = `${prompt}

Required JSON Schema:
${JSON.stringify(schema, null, 2)}

Output ONLY the JSON response, nothing else.`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.completion(messages, {
      ...options,
      jsonMode: true,
      temperature: options.temperature ?? 0.3, // Lower temperature for structured outputs
    });

    try {
      const data = this.parseJSON<T>(response.content);

      return {
        data,
        raw: response.content,
      };
    } catch (error) {
      this.logger.error(`Failed to parse structured response: ${error.message}`);
      this.logger.error(`Raw response: ${response.content}`);
      throw error;
    }
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      this.logger.error(`OpenAI connection test failed: ${error.message}`);
      return false;
    }
  }
}
