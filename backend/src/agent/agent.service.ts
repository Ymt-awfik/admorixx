import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAdsService } from '../integrations/google-ads/google-ads.service';

/**
 * Agent Service - Semi-Autonomous Action System
 *
 * CRITICAL SAFETY PRINCIPLES:
 * 1. NEVER auto-execute without approval
 * 2. All actions must have rollback capability
 * 3. All actions must be auditable
 * 4. Risk assessment for every action
 * 5. User can reject/approve every proposal
 */

export interface ActionProposal {
  actionType: string;
  entityType: string;
  entityId: string;
  proposedChanges: any;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedImpact: any;
}

export interface SafetyChecks {
  withinBudgetLimits: boolean;
  notRecentlyChanged: boolean;
  meetsPerformanceThreshold: boolean;
  userApprovalRequired: boolean;
  rollbackAvailable: boolean;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  // Safety thresholds
  private readonly MAX_BUDGET_INCREASE_PERCENT = 50;
  private readonly MIN_HOURS_BETWEEN_CHANGES = 24;
  private readonly AUTO_APPROVE_RISK_LEVELS = []; // Empty = require approval for all

  constructor(
    private prisma: PrismaService,
    private googleAdsService: GoogleAdsService,
  ) {}

  /**
   * Create action proposal from decision
   * Converts decision engine output into actionable proposal
   */
  async createProposal(
    userId: string,
    adAccountId: string,
    decisionLogId: string,
  ): Promise<any> {
    const decision = await this.prisma.decisionLog.findFirst({
      where: {
        id: decisionLogId,
        userId,
        adAccountId,
      },
      include: {
        campaign: true,
      },
    });

    if (!decision) {
      throw new BadRequestException('Decision not found');
    }

    // Determine action details based on decision type
    const proposal = await this.buildProposal(decision);

    // Run safety checks
    const safetyChecks = await this.runSafetyChecks(proposal, decision);

    // Assess risk level
    const riskLevel = this.assessRiskLevel(proposal, safetyChecks);

    // Create agent action
    const agentAction = await this.prisma.agentAction.create({
      data: {
        userId,
        adAccountId,
        actionType: proposal.actionType as any,
        status: 'PROPOSED',
        entityType: proposal.entityType,
        entityId: proposal.entityId,
        proposedChanges: proposal.proposedChanges,
        reasoning: proposal.reasoning,
        riskLevel,
        safetyChecks: safetyChecks as any,
        estimatedImpact: proposal.estimatedImpact,
        requiresApproval: true, // Always require approval in v1
        canRollback: proposal.canRollback,
        rollbackData: proposal.rollbackData,
      },
    });

    this.logger.log(
      `Created proposal ${agentAction.id} for ${proposal.actionType}`,
    );

    return agentAction;
  }

  /**
   * Build proposal from decision
   */
  private async buildProposal(decision: any): Promise<any> {
    const proposedAction = decision.proposedAction;

    switch (decision.decisionType) {
      case 'PAUSE_CAMPAIGN':
        return {
          actionType: 'PAUSE_CAMPAIGN',
          entityType: 'campaign',
          entityId: decision.campaignId,
          proposedChanges: {
            status: 'PAUSED',
          },
          reasoning: decision.reasoning,
          estimatedImpact: {
            spendPrevention: proposedAction.currentBudget * 7, // Prevent 7 days of spend
            riskMitigation: 'Stops further losses',
          },
          canRollback: true,
          rollbackData: {
            previousStatus: decision.campaign.status,
          },
        };

      case 'INCREASE_BUDGET':
        return {
          actionType: 'ADJUST_BUDGET',
          entityType: 'campaign',
          entityId: decision.campaignId,
          proposedChanges: {
            budgetAmount: proposedAction.proposedBudget,
            change: 'increase',
            percent: proposedAction.scalePercent,
          },
          reasoning: decision.reasoning,
          estimatedImpact: {
            additionalSpend: proposedAction.budgetIncrease,
            projectedRevenue:
              proposedAction.budgetIncrease *
              decision.metricsSnapshot.last_7_days_roas,
            projectedROAS: decision.metricsSnapshot.last_7_days_roas,
          },
          canRollback: true,
          rollbackData: {
            previousBudget: proposedAction.currentBudget,
          },
        };

      case 'DECREASE_BUDGET':
        return {
          actionType: 'ADJUST_BUDGET',
          entityType: 'campaign',
          entityId: decision.campaignId,
          proposedChanges: {
            budgetAmount: proposedAction.proposedBudget,
            change: 'decrease',
            percent: proposedAction.budgetReduction,
          },
          reasoning: decision.reasoning,
          estimatedImpact: {
            spendReduction:
              proposedAction.currentBudget - proposedAction.proposedBudget,
            riskMitigation: 'Limits losses while monitoring',
          },
          canRollback: true,
          rollbackData: {
            previousBudget: proposedAction.currentBudget,
          },
        };

      default:
        throw new BadRequestException(
          `Unsupported decision type: ${decision.decisionType}`,
        );
    }
  }

  /**
   * Run safety checks on proposal
   */
  private async runSafetyChecks(
    proposal: any,
    decision: any,
  ): Promise<SafetyChecks> {
    const checks: SafetyChecks = {
      withinBudgetLimits: true,
      notRecentlyChanged: true,
      meetsPerformanceThreshold: true,
      userApprovalRequired: true,
      rollbackAvailable: proposal.canRollback,
    };

    // Check budget increase limits
    if (
      proposal.actionType === 'ADJUST_BUDGET' &&
      proposal.proposedChanges.change === 'increase'
    ) {
      const increasePercent = proposal.proposedChanges.percent;
      checks.withinBudgetLimits =
        increasePercent <= this.MAX_BUDGET_INCREASE_PERCENT;
    }

    // Check if campaign was recently modified
    const recentActions = await this.prisma.agentAction.count({
      where: {
        entityType: proposal.entityType,
        entityId: proposal.entityId,
        status: { in: ['COMPLETED', 'EXECUTING'] },
        executedAt: {
          gte: new Date(
            Date.now() - this.MIN_HOURS_BETWEEN_CHANGES * 60 * 60 * 1000,
          ),
        },
      },
    });

    checks.notRecentlyChanged = recentActions === 0;

    // Check performance thresholds
    if (decision.confidenceScore < 70) {
      checks.meetsPerformanceThreshold = false;
    }

    return checks;
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(
    proposal: any,
    safetyChecks: SafetyChecks,
  ): 'low' | 'medium' | 'high' {
    // High risk conditions
    if (
      !safetyChecks.withinBudgetLimits ||
      !safetyChecks.rollbackAvailable
    ) {
      return 'high';
    }

    // Medium risk conditions
    if (
      !safetyChecks.notRecentlyChanged ||
      !safetyChecks.meetsPerformanceThreshold
    ) {
      return 'medium';
    }

    // Budget increases are medium risk by default
    if (
      proposal.actionType === 'ADJUST_BUDGET' &&
      proposal.proposedChanges.change === 'increase'
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get pending proposals for user
   */
  async getPendingProposals(userId: string): Promise<any[]> {
    return this.prisma.agentAction.findMany({
      where: {
        userId,
        status: 'PROPOSED',
      },
      orderBy: [
        { riskLevel: 'desc' }, // High risk first
        { createdAt: 'desc' },
      ],
      include: {
        adAccount: {
          select: {
            accountName: true,
            platform: true,
          },
        },
      },
    });
  }

  /**
   * Approve proposal
   */
  async approveProposal(
    userId: string,
    actionId: string,
  ): Promise<any> {
    const action = await this.prisma.agentAction.findFirst({
      where: {
        id: actionId,
        userId,
        status: 'PROPOSED',
      },
    });

    if (!action) {
      throw new BadRequestException('Proposal not found or already processed');
    }

    // Update status
    await this.prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    // Execute action
    await this.executeAction(actionId);

    return { message: 'Proposal approved and executed' };
  }

  /**
   * Reject proposal
   */
  async rejectProposal(
    userId: string,
    actionId: string,
    reason?: string,
  ): Promise<any> {
    const action = await this.prisma.agentAction.findFirst({
      where: {
        id: actionId,
        userId,
        status: 'PROPOSED',
      },
    });

    if (!action) {
      throw new BadRequestException('Proposal not found or already processed');
    }

    await this.prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason || 'User rejected',
      },
    });

    return { message: 'Proposal rejected' };
  }

  /**
   * Execute approved action
   * THIS IS WHERE ACTUAL API CALLS HAPPEN
   */
  private async executeAction(actionId: string): Promise<void> {
    const action = await this.prisma.agentAction.findUnique({
      where: { id: actionId },
      include: {
        adAccount: true,
      },
    });

    if (!action || action.status !== 'APPROVED') {
      throw new BadRequestException('Action not ready for execution');
    }

    try {
      // Update status to executing
      await this.prisma.agentAction.update({
        where: { id: actionId },
        data: { status: 'EXECUTING' },
      });

      let result: any = {};

      // Execute based on action type
      switch (action.actionType) {
        case 'PAUSE_CAMPAIGN':
          result = await this.executePauseCampaign(action);
          break;

        case 'ENABLE_CAMPAIGN':
          result = await this.executeEnableCampaign(action);
          break;

        case 'ADJUST_BUDGET':
          result = await this.executeAdjustBudget(action);
          break;

        default:
          throw new Error(`Unsupported action type: ${action.actionType}`);
      }

      // Mark as completed
      await this.prisma.agentAction.update({
        where: { id: actionId },
        data: {
          status: 'COMPLETED',
          executedAt: new Date(),
          executionResult: result,
        },
      });

      this.logger.log(`Successfully executed action ${actionId}`);
    } catch (error) {
      this.logger.error(`Failed to execute action ${actionId}: ${error.message}`);

      await this.prisma.agentAction.update({
        where: { id: actionId },
        data: {
          status: 'FAILED',
          executionError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Execute pause campaign action
   * In v1, this would call Google Ads API to pause the campaign
   */
  private async executePauseCampaign(action: any): Promise<any> {
    // In production, call Google Ads API here
    // For now, update local database

    await this.prisma.campaign.update({
      where: { id: action.entityId },
      data: { status: 'PAUSED' },
    });

    return {
      campaignId: action.entityId,
      newStatus: 'PAUSED',
      executedAt: new Date(),
    };
  }

  /**
   * Execute enable campaign action
   */
  private async executeEnableCampaign(action: any): Promise<any> {
    await this.prisma.campaign.update({
      where: { id: action.entityId },
      data: { status: 'ENABLED' },
    });

    return {
      campaignId: action.entityId,
      newStatus: 'ENABLED',
      executedAt: new Date(),
    };
  }

  /**
   * Execute budget adjustment
   */
  private async executeAdjustBudget(action: any): Promise<any> {
    const newBudget = action.proposedChanges.budgetAmount;

    await this.prisma.campaign.update({
      where: { id: action.entityId },
      data: { budgetAmount: newBudget },
    });

    return {
      campaignId: action.entityId,
      previousBudget: action.rollbackData.previousBudget,
      newBudget,
      change: action.proposedChanges.change,
      percent: action.proposedChanges.percent,
      executedAt: new Date(),
    };
  }

  /**
   * Rollback action (if something goes wrong)
   */
  async rollbackAction(
    userId: string,
    actionId: string,
  ): Promise<any> {
    const action = await this.prisma.agentAction.findFirst({
      where: {
        id: actionId,
        userId,
        status: 'COMPLETED',
        canRollback: true,
      },
    });

    if (!action) {
      throw new BadRequestException('Action not found or cannot be rolled back');
    }

    try {
      // Restore previous state
      const rollbackData = action.rollbackData as any;

      switch (action.actionType) {
        case 'PAUSE_CAMPAIGN':
        case 'ENABLE_CAMPAIGN':
          await this.prisma.campaign.update({
            where: { id: action.entityId },
            data: { status: rollbackData.previousStatus },
          });
          break;

        case 'ADJUST_BUDGET':
          await this.prisma.campaign.update({
            where: { id: action.entityId },
            data: { budgetAmount: rollbackData.previousBudget },
          });
          break;
      }

      await this.prisma.agentAction.update({
        where: { id: actionId },
        data: {
          status: 'ROLLED_BACK',
          rolledBackAt: new Date(),
        },
      });

      return { message: 'Action rolled back successfully' };
    } catch (error) {
      this.logger.error(`Failed to rollback action: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get action history
   */
  async getActionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.agentAction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        adAccount: {
          select: {
            accountName: true,
          },
        },
      },
    });
  }
}
