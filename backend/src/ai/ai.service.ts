import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BaseAIProvider } from './providers/base-ai.provider';
import { OpenAIProvider } from './providers/openai.provider';

/**
 * AI Service - Provider-Agnostic AI Operations
 *
 * CRITICAL PRINCIPLES:
 * 1. AI NEVER makes decisions autonomously
 * 2. AI ONLY provides: explanations, insights, prioritization, creative ideas
 * 3. All AI outputs must be structured JSON
 * 4. All AI operations must be auditable
 */

export interface DecisionExplanationInput {
  campaignName: string;
  metricsSnapshot: any;
  proposedAction: any;
  ruleName: string;
}

export interface DecisionExplanation {
  summary: string;
  keyFactors: string[];
  risks: string[];
  expectedImpact: string;
  confidence: number;
}

export interface InsightSummary {
  overview: string;
  topOpportunities: Array<{
    campaign: string;
    opportunity: string;
    priority: number;
  }>;
  topRisks: Array<{
    campaign: string;
    risk: string;
    severity: number;
  }>;
  recommendations: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: BaseAIProvider;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private openaiProvider: OpenAIProvider,
  ) {
    // Select provider based on configuration
    const providerType = this.configService.get<string>('AI_PROVIDER') || 'openai';

    switch (providerType) {
      case 'openai':
        this.provider = openaiProvider;
        break;
      // Future: Add Anthropic, Azure, etc.
      default:
        this.provider = openaiProvider;
    }

    this.logger.log(`Initialized AI provider: ${this.provider.provider}`);
  }

  /**
   * Generate explanation for a decision
   * AI explains WHY a decision was made by the rule engine
   */
  async explainDecision(
    input: DecisionExplanationInput,
  ): Promise<DecisionExplanation> {
    const prompt = `You are an expert advertising analyst. Explain the following campaign decision in clear, business-friendly language.

Campaign: ${input.campaignName}
Rule: ${input.ruleName}
Metrics: ${JSON.stringify(input.metricsSnapshot, null, 2)}
Proposed Action: ${JSON.stringify(input.proposedAction, null, 2)}

Provide a structured explanation that helps a marketer understand:
1. What the data shows
2. Why this action is recommended
3. Key factors driving the decision
4. Potential risks to consider
5. Expected impact if action is taken

Be specific, data-driven, and actionable.`;

    const schema = {
      summary: 'string: 2-3 sentence overview',
      keyFactors: 'array of strings: 3-5 key factors',
      risks: 'array of strings: 2-4 potential risks',
      expectedImpact: 'string: expected outcome',
      confidence: 'number: 0-100 confidence score',
    };

    const response = await this.provider.structuredCompletion<DecisionExplanation>(
      prompt,
      schema,
      { temperature: 0.5 },
    );

    return response.data;
  }

  /**
   * Generate prioritized insights summary for multiple decisions
   */
  async generateInsightsSummary(
    decisions: any[],
  ): Promise<InsightSummary> {
    if (decisions.length === 0) {
      return {
        overview: 'No active decisions or alerts at this time.',
        topOpportunities: [],
        topRisks: [],
        recommendations: ['Continue monitoring campaign performance.'],
      };
    }

    const prompt = `You are an expert advertising strategist. Analyze the following campaign decisions and provide a strategic summary.

Decisions:
${JSON.stringify(decisions, null, 2)}

Provide:
1. High-level overview (2-3 sentences)
2. Top 3 growth opportunities (campaigns to scale)
3. Top 3 risks (campaigns to pause/optimize)
4. 3-5 strategic recommendations

Focus on actionable insights and prioritization.`;

    const schema = {
      overview: 'string: high-level summary',
      topOpportunities: 'array of objects: { campaign, opportunity, priority (1-10) }',
      topRisks: 'array of objects: { campaign, risk, severity (1-10) }',
      recommendations: 'array of strings: actionable recommendations',
    };

    const response = await this.provider.structuredCompletion<InsightSummary>(
      prompt,
      schema,
      { temperature: 0.6 },
    );

    return response.data;
  }

  /**
   * Analyze campaign performance and provide strategic insights
   */
  async analyzeCampaignPerformance(
    campaignData: any,
    metricsHistory: any[],
  ): Promise<any> {
    const prompt = `You are an expert performance marketer. Analyze this campaign's performance data and provide strategic insights.

Campaign: ${JSON.stringify(campaignData, null, 2)}
Metrics History: ${JSON.stringify(metricsHistory, null, 2)}

Provide:
1. Performance assessment (excellent/good/concerning/poor)
2. Trend analysis (improving/stable/declining)
3. Key strengths (what's working well)
4. Key weaknesses (what needs improvement)
5. Specific optimization suggestions
6. Confidence level in your assessment

Be specific and data-driven.`;

    const schema = {
      assessment: 'string: performance level',
      trend: 'string: trend direction',
      strengths: 'array of strings',
      weaknesses: 'array of strings',
      suggestions: 'array of strings',
      confidence: 'number: 0-100',
    };

    const response = await this.provider.structuredCompletion(
      prompt,
      schema,
      { temperature: 0.5 },
    );

    return response.data;
  }

  /**
   * Get AI provider info
   */
  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: this.provider.provider,
      model: this.provider.model,
    };
  }

  /**
   * Save AI recommendation to database
   */
  async saveRecommendation(
    adAccountId: string,
    type: string,
    data: any,
  ): Promise<void> {
    try {
      await this.prisma.aiRecommendation.create({
        data: {
          adAccountId,
          type: type as any,
          priority: data.priority || 50,
          title: data.title || 'AI Recommendation',
          summary: data.summary || '',
          detailedAnalysis: data.detailedAnalysis || '',
          dataSnapshot: data.dataSnapshot || {},
          confidenceScore: data.confidence || 70,
          suggestedActions: data.suggestedActions || [],
          modelUsed: this.provider.model,
          promptVersion: '1.0',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save AI recommendation: ${error.message}`);
    }
  }

  /**
   * Get recent AI recommendations
   */
  async getRecommendations(
    adAccountId: string,
    limit: number = 10,
  ): Promise<any[]> {
    return this.prisma.aiRecommendation.findMany({
      where: {
        adAccountId,
        isDismissed: false,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });
  }
}
