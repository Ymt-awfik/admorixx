import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IDecisionRule,
  RuleContext,
  RuleDecision,
  CampaignMetrics,
  HistoricalMetrics,
} from './rules/base-rule.interface';
import { LosingCampaignRule } from './rules/losing-campaign.rule';
import { WinnerScalingRule } from './rules/winner-scaling.rule';
import { subDays, startOfDay } from 'date-fns';

export interface DecisionEngineResult {
  campaignId: string;
  campaignName: string;
  decisions: RuleDecision[];
  highestPriority?: RuleDecision;
  timestamp: Date;
}

@Injectable()
export class DecisionEngineService {
  private readonly logger = new Logger(DecisionEngineService.name);
  private rules: IDecisionRule[] = [];

  constructor(
    private prisma: PrismaService,
    private losingCampaignRule: LosingCampaignRule,
    private winnerScalingRule: WinnerScalingRule,
  ) {
    // Register all rules
    this.registerRule(losingCampaignRule);
    this.registerRule(winnerScalingRule);
    // Additional rules can be registered here
  }

  /**
   * Register a decision rule
   */
  private registerRule(rule: IDecisionRule): void {
    this.rules.push(rule);
    this.logger.log(`Registered rule: ${rule.name} v${rule.version}`);
  }

  /**
   * Run decision engine for a specific campaign
   */
  async evaluateCampaign(campaignId: string): Promise<DecisionEngineResult> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        adAccount: true,
      },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Gather metrics
    const historicalMetrics = await this.gatherHistoricalMetrics(campaignId);

    // Build rule context
    const context: RuleContext = {
      campaignId: campaign.id,
      adAccountId: campaign.adAccountId,
      userId: campaign.adAccount.userId,
      metrics: historicalMetrics.last7Days, // Current metrics
      historicalMetrics,
      campaignInfo: {
        name: campaign.name,
        status: campaign.status,
        budgetAmount: campaign.budgetAmount,
        budgetType: campaign.budgetType,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
    };

    // Evaluate all rules
    const decisions: RuleDecision[] = [];

    for (const rule of this.rules) {
      try {
        const decision = await rule.evaluate(context);

        if (decision.triggered) {
          decisions.push(decision);

          // Log decision to database
          await this.logDecision(
            campaign.adAccount.userId,
            campaign.adAccountId,
            campaignId,
            decision,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating rule ${rule.name}: ${error.message}`,
        );
      }
    }

    // Sort decisions by priority
    decisions.sort((a, b) => b.priority - a.priority);

    const highestPriority = decisions.length > 0 ? decisions[0] : undefined;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      decisions,
      highestPriority,
      timestamp: new Date(),
    };
  }

  /**
   * Run decision engine for all campaigns in an ad account
   */
  async evaluateAdAccount(
    adAccountId: string,
  ): Promise<DecisionEngineResult[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        adAccountId,
        status: 'ENABLED', // Only evaluate active campaigns
      },
    });

    const results: DecisionEngineResult[] = [];

    for (const campaign of campaigns) {
      try {
        const result = await this.evaluateCampaign(campaign.id);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Error evaluating campaign ${campaign.id}: ${error.message}`,
        );
      }
    }

    return results;
  }

  /**
   * Run decision engine for all campaigns belonging to a user
   */
  async evaluateUserCampaigns(userId: string): Promise<DecisionEngineResult[]> {
    const adAccounts = await this.prisma.adAccount.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const allResults: DecisionEngineResult[] = [];

    for (const adAccount of adAccounts) {
      const results = await this.evaluateAdAccount(adAccount.id);
      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * Gather historical metrics for a campaign
   */
  private async gatherHistoricalMetrics(
    campaignId: string,
  ): Promise<HistoricalMetrics> {
    const now = new Date();
    const periods = [
      { name: 'last3Days', days: 3 },
      { name: 'last7Days', days: 7 },
      { name: 'last14Days', days: 14 },
      { name: 'last30Days', days: 30 },
    ];

    const historicalMetrics: any = {};

    for (const period of periods) {
      const startDate = startOfDay(subDays(now, period.days));

      const metrics = await this.prisma.metricDaily.aggregate({
        where: {
          campaignId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        _sum: {
          impressions: true,
          clicks: true,
          conversions: true,
          spend: true,
          revenue: true,
        },
      });

      const impressions = metrics._sum.impressions || 0;
      const clicks = metrics._sum.clicks || 0;
      const conversions = metrics._sum.conversions || 0;
      const spend = metrics._sum.spend || 0;
      const revenue = metrics._sum.revenue || 0;

      // Calculate derived metrics
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpa = conversions > 0 ? spend / conversions : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      historicalMetrics[period.name] = {
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr,
        cpc,
        cpa,
        roas,
      };
    }

    return historicalMetrics as HistoricalMetrics;
  }

  /**
   * Log decision to database
   */
  private async logDecision(
    userId: string,
    adAccountId: string,
    campaignId: string,
    decision: RuleDecision,
  ): Promise<void> {
    try {
      await this.prisma.decisionLog.create({
        data: {
          userId,
          adAccountId,
          campaignId,
          decisionType: decision.decisionType as any,
          status: 'PENDING',
          ruleName: decision.ruleName,
          ruleVersion: decision.ruleVersion,
          confidenceScore: decision.confidence,
          metricsSnapshot: decision.metricsSnapshot,
          reasoning: decision.reasoning,
          proposedAction: decision.proposedAction || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log decision: ${error.message}`);
    }
  }

  /**
   * Get recent decisions for a user
   */
  async getRecentDecisions(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.decisionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        campaign: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get pending decisions (requiring approval)
   */
  async getPendingDecisions(userId: string): Promise<any[]> {
    return this.prisma.decisionLog.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: [
        { confidenceScore: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        campaign: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });
  }
}
