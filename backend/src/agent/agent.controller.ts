import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';

@ApiTags('Agent')
@Controller('agent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Post('proposals/create')
  @ApiOperation({ summary: 'Create action proposal from decision' })
  async createProposal(
    @CurrentUser() user: CurrentUserData,
    @Body('adAccountId') adAccountId: string,
    @Body('decisionLogId') decisionLogId: string,
  ) {
    const proposal = await this.agentService.createProposal(
      user.userId,
      adAccountId,
      decisionLogId,
    );

    return {
      success: true,
      data: proposal,
    };
  }

  @Get('proposals')
  @ApiOperation({ summary: 'Get pending proposals requiring approval' })
  async getPendingProposals(@CurrentUser() user: CurrentUserData) {
    const proposals = await this.agentService.getPendingProposals(user.userId);

    return {
      success: true,
      count: proposals.length,
      data: proposals,
    };
  }

  @Post('proposals/:id/approve')
  @ApiOperation({ summary: 'Approve and execute proposal' })
  async approveProposal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') actionId: string,
  ) {
    const result = await this.agentService.approveProposal(
      user.userId,
      actionId,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('proposals/:id/reject')
  @ApiOperation({ summary: 'Reject proposal' })
  async rejectProposal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') actionId: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.agentService.rejectProposal(
      user.userId,
      actionId,
      reason,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('actions/:id/rollback')
  @ApiOperation({ summary: 'Rollback executed action' })
  async rollbackAction(
    @CurrentUser() user: CurrentUserData,
    @Param('id') actionId: string,
  ) {
    const result = await this.agentService.rollbackAction(user.userId, actionId);

    return {
      success: true,
      ...result,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get action execution history' })
  async getHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    const history = await this.agentService.getActionHistory(
      user.userId,
      limit ? parseInt(limit.toString()) : 50,
    );

    return {
      success: true,
      count: history.length,
      data: history,
    };
  }
}
