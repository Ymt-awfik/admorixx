import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { VIRAL_PATTERNS, PatternTemplate } from './creative-patterns.data';

export interface CreativeGenerationInput {
  productName: string;
  productDescription: string;
  targetAudience: string;
  platform: 'TIKTOK' | 'INSTAGRAM_REELS' | 'YOUTUBE_SHORTS' | 'FACEBOOK_REELS';
  pattern?: string; // Optional: specific pattern to use
  numberOfVariants?: number; // How many hook variants to generate
}

export interface GeneratedCreative {
  platform: string;
  pattern: string;
  patternName: string;
  title: string;
  description: string;
  hooks: string[]; // 5-10 hook variants
  storyboard: Array<{
    shotNumber: number;
    timeRange: string;
    description: string;
    visualNotes: string;
    audioNotes?: string;
  }>;
  cta: string;
  viralConfidenceScore: number;
  reasoningForScore: string;
  targetAudience: {
    demographics: string;
    interests: string[];
    painPoints: string[];
  };
  productionNotes: string[];
  estimatedBudget: string;
}

@Injectable()
export class CreativesService {
  private readonly logger = new Logger(CreativesService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Generate viral video ad creative ideas
   * Uses pattern library + AI for execution details
   */
  async generateCreative(
    userId: string,
    input: CreativeGenerationInput,
  ): Promise<GeneratedCreative> {
    // Select pattern
    const pattern = input.pattern
      ? VIRAL_PATTERNS[input.pattern]
      : this.selectBestPattern(input);

    if (!pattern) {
      throw new BadRequestException('Invalid pattern selected');
    }

    this.logger.log(
      `Generating creative for ${input.productName} using ${pattern.name} pattern`,
    );

    // Use AI to generate execution-ready creative
    const creative = await this.generateWithAI(input, pattern);

    // Save to database
    await this.saveCreative(userId, creative, input);

    return creative;
  }

  /**
   * Generate creative using AI based on pattern template
   */
  private async generateWithAI(
    input: CreativeGenerationInput,
    pattern: PatternTemplate,
  ): Promise<GeneratedCreative> {
    const numberOfHooks = input.numberOfVariants || 7;

    const prompt = `You are a viral video advertising expert specializing in ${input.platform}.

Generate a COMPLETE, EXECUTION-READY video ad creative concept using the following:

Product: ${input.productName}
Description: ${input.productDescription}
Target Audience: ${input.targetAudience}
Platform: ${input.platform}
Creative Pattern: ${pattern.name}

Pattern Structure:
${JSON.stringify(pattern.structure, null, 2)}

Pattern Best Practices:
${pattern.description}

Generate:

1. TITLE: Catchy internal name for this creative

2. DESCRIPTION: 2-3 sentence overview of the creative concept

3. HOOKS: ${numberOfHooks} different hook variants for the first 3 seconds
   - Each hook must stop the scroll
   - Each must be different (question, statement, shock, tease, etc.)
   - All must align with the ${pattern.name} pattern
   - Include both text overlay and spoken hook where applicable

4. STORYBOARD: Shot-by-shot breakdown with:
   - Shot number
   - Time range (e.g., "0-3s")
   - Detailed visual description (what viewer sees)
   - Detailed audio notes (what viewer hears)
   - Visual effects notes if needed

5. CTA: Strong call-to-action that drives conversion

6. VIRAL CONFIDENCE SCORE: 0-100 score with reasoning
   - Score based on: pattern effectiveness, hook quality, trend alignment, execution feasibility

7. TARGET AUDIENCE: Specific demographics, interests, and pain points

8. PRODUCTION NOTES: 5-7 practical tips for filming/editing

Be SPECIFIC and ACTIONABLE. This should be ready for a video editor to execute.`;

    const schema = {
      platform: 'string',
      pattern: 'string',
      patternName: 'string',
      title: 'string',
      description: 'string',
      hooks: 'array of strings (5-10 variants)',
      storyboard: 'array of objects: { shotNumber, timeRange, description, visualNotes, audioNotes }',
      cta: 'string',
      viralConfidenceScore: 'number (0-100)',
      reasoningForScore: 'string',
      targetAudience: 'object: { demographics, interests (array), painPoints (array) }',
      productionNotes: 'array of strings',
      estimatedBudget: 'string (e.g., "$500-$1000")',
    };

    const response = await this.aiService['provider'].structuredCompletion<GeneratedCreative>(
      prompt,
      schema,
      { temperature: 0.8, maxTokens: 3000 },
    );

    // Ensure pattern fields are set correctly
    response.data.pattern = pattern.pattern;
    response.data.patternName = pattern.name;
    response.data.platform = input.platform;

    return response.data;
  }

  /**
   * Select best pattern based on product/audience
   */
  private selectBestPattern(input: CreativeGenerationInput): PatternTemplate {
    // Simple heuristic - in production, could use AI or more sophisticated matching
    const patterns = Object.values(VIRAL_PATTERNS);

    // For now, return highest avg viral score pattern
    // In production, match based on product type, audience, goals
    patterns.sort((a, b) => b.avgViralScore - a.avgViralScore);

    return patterns[0];
  }

  /**
   * Save creative to database
   */
  private async saveCreative(
    userId: string,
    creative: GeneratedCreative,
    input: CreativeGenerationInput,
  ): Promise<void> {
    try {
      await this.prisma.creativeIdea.create({
        data: {
          userId,
          platform: creative.platform as any,
          pattern: creative.pattern as any,
          title: creative.title,
          description: creative.description,
          hooks: creative.hooks,
          storyboard: creative.storyboard,
          cta: creative.cta,
          viralConfidenceScore: creative.viralConfidenceScore,
          reasoningForScore: creative.reasoningForScore,
          targetAudience: creative.targetAudience,
          modelUsed: this.aiService.getProviderInfo().model,
          promptVersion: '1.0',
          generationParams: {
            productName: input.productName,
            productDescription: input.productDescription,
            targetAudience: input.targetAudience,
          },
        },
      });

      this.logger.log(`Saved creative: ${creative.title}`);
    } catch (error) {
      this.logger.error(`Failed to save creative: ${error.message}`);
    }
  }

  /**
   * Get user's creative ideas
   */
  async getUserCreatives(
    userId: string,
    filters?: {
      platform?: string;
      pattern?: string;
      isFavorite?: boolean;
    },
  ): Promise<any[]> {
    const where: any = { userId };

    if (filters?.platform) {
      where.platform = filters.platform;
    }

    if (filters?.pattern) {
      where.pattern = filters.pattern;
    }

    if (filters?.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    return this.prisma.creativeIdea.findMany({
      where,
      orderBy: [
        { viralConfidenceScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get available patterns
   */
  getAvailablePatterns(): any[] {
    return Object.values(VIRAL_PATTERNS).map((pattern) => ({
      pattern: pattern.pattern,
      name: pattern.name,
      description: pattern.description,
      bestFor: pattern.bestFor,
      avgViralScore: pattern.avgViralScore,
    }));
  }

  /**
   * Mark creative as favorite
   */
  async toggleFavorite(
    userId: string,
    creativeId: string,
  ): Promise<void> {
    const creative = await this.prisma.creativeIdea.findFirst({
      where: { id: creativeId, userId },
    });

    if (!creative) {
      throw new BadRequestException('Creative not found');
    }

    await this.prisma.creativeIdea.update({
      where: { id: creativeId },
      data: { isFavorite: !creative.isFavorite },
    });
  }

  /**
   * Mark creative as used
   */
  async markAsUsed(
    userId: string,
    creativeId: string,
  ): Promise<void> {
    const creative = await this.prisma.creativeIdea.findFirst({
      where: { id: creativeId, userId },
    });

    if (!creative) {
      throw new BadRequestException('Creative not found');
    }

    await this.prisma.creativeIdea.update({
      where: { id: creativeId },
      data: { isUsed: true },
    });
  }
}
