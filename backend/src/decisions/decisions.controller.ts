import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DecisionEngineService } from './decision-engine.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';

@ApiTags('Decisions')
@Controller('decisions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DecisionsController {
  constructor(private decisionEngine: DecisionEngineService) {}

  @Post('evaluate/campaign/:campaignId')
  @ApiOperation({ summary: 'Run decision engine for a specific campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  async evaluateCampaign(@Param('campaignId') campaignId: string) {
    const result = await this.decisionEngine.evaluateCampaign(campaignId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('evaluate/ad-account/:adAccountId')
  @ApiOperation({
    summary: 'Run decision engine for all campaigns in an ad account',
  })
  @ApiParam({ name: 'adAccountId', description: 'Ad Account ID' })
  async evaluateAdAccount(@Param('adAccountId') adAccountId: string) {
    const results = await this.decisionEngine.evaluateAdAccount(adAccountId);

    const summary = {
      totalCampaigns: results.length,
      campaignsWithDecisions: results.filter((r) => r.decisions.length > 0)
        .length,
      highPriorityDecisions: results.filter(
        (r) => r.highestPriority && r.highestPriority.priority >= 8,
      ).length,
    };

    return {
      success: true,
      summary,
      data: results,
    };
  }

  @Post('evaluate/all')
  @ApiOperation({
    summary: 'Run decision engine for all campaigns belonging to current user',
  })
  async evaluateAll(@CurrentUser() user: CurrentUserData) {
    const results = await this.decisionEngine.evaluateUserCampaigns(
      user.userId,
    );

    const summary = {
      totalCampaigns: results.length,
      campaignsWithDecisions: results.filter((r) => r.decisions.length > 0)
        .length,
      highPriorityDecisions: results.filter(
        (r) => r.highestPriority && r.highestPriority.priority >= 8,
      ).length,
    };

    return {
      success: true,
      summary,
      data: results,
    };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent decisions for current user' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of decisions to return',
  })
  async getRecent(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    const decisions = await this.decisionEngine.getRecentDecisions(
      user.userId,
      limit || 50,
    );

    return {
      success: true,
      count: decisions.length,
      data: decisions,
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending decisions requiring approval' })
  async getPending(@CurrentUser() user: CurrentUserData) {
    const decisions = await this.decisionEngine.getPendingDecisions(
      user.userId,
    );

    return {
      success: true,
      count: decisions.length,
      data: decisions,
    };
  }
}
