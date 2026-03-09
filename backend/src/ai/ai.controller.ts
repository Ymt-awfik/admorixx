import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('provider')
  @ApiOperation({ summary: 'Get current AI provider information' })
  getProvider() {
    return this.aiService.getProviderInfo();
  }

  @Post('explain-decision')
  @ApiOperation({ summary: 'Get AI explanation for a decision' })
  async explainDecision(@Body() input: any) {
    const explanation = await this.aiService.explainDecision(input);
    return {
      success: true,
      data: explanation,
    };
  }

  @Post('insights-summary')
  @ApiOperation({ summary: 'Generate AI insights summary from decisions' })
  async generateInsights(@Body('decisions') decisions: any[]) {
    const summary = await this.aiService.generateInsightsSummary(decisions);
    return {
      success: true,
      data: summary,
    };
  }

  @Post('analyze-campaign')
  @ApiOperation({ summary: 'Get AI analysis of campaign performance' })
  async analyzeCampaign(
    @Body('campaignData') campaignData: any,
    @Body('metricsHistory') metricsHistory: any[],
  ) {
    const analysis = await this.aiService.analyzeCampaignPerformance(
      campaignData,
      metricsHistory,
    );
    return {
      success: true,
      data: analysis,
    };
  }

  @Get('recommendations/:adAccountId')
  @ApiOperation({ summary: 'Get AI recommendations for an ad account' })
  async getRecommendations(
    @Param('adAccountId') adAccountId: string,
    @Query('limit') limit?: number,
  ) {
    const recommendations = await this.aiService.getRecommendations(
      adAccountId,
      limit ? parseInt(limit.toString()) : 10,
    );
    return {
      success: true,
      count: recommendations.length,
      data: recommendations,
    };
  }
}
