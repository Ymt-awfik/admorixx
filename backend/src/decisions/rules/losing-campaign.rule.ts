import { Injectable } from '@nestjs/common';
import {
  IDecisionRule,
  RuleContext,
  RuleDecision,
} from './base-rule.interface';

/**
 * RULE: Losing Campaign Detection
 *
 * Triggers when:
 * - Campaign is spending money (spend > $50 in last 7 days)
 * - ROAS < target threshold (default: 1.5)
 * - Negative trend over last 3 days
 * - Conversion rate declining
 *
 * Action: Propose pausing or budget reduction
 */
@Injectable()
export class LosingCampaignRule implements IDecisionRule {
  name = 'losing_campaign_detection';
  version = '1.0.0';
  description = 'Detects campaigns with poor ROAS and declining performance';

  private readonly MIN_SPEND_THRESHOLD = 50; // Minimum $50 spend to evaluate
  private readonly TARGET_ROAS = 1.5; // Target ROAS threshold
  private readonly ROAS_CRITICAL = 0.8; // Critical ROAS threshold
  private readonly TREND_LOOKBACK_DAYS = 3;

  async evaluate(context: RuleContext): Promise<RuleDecision> {
    const { metrics, historicalMetrics, campaignInfo } = context;

    // Skip if campaign is already paused
    if (campaignInfo.status !== 'ENABLED') {
      return this.noDecision();
    }

    // Check minimum spend threshold
    if (historicalMetrics.last7Days.spend < this.MIN_SPEND_THRESHOLD) {
      return this.noDecision('Insufficient spend for evaluation');
    }

    // Calculate current ROAS
    const currentRoas = historicalMetrics.last7Days.roas;

    // Check if ROAS is below target
    if (currentRoas >= this.TARGET_ROAS) {
      return this.noDecision('ROAS meets target');
    }

    // Calculate trend (comparing last 3 days vs previous 4 days)
    const last3DaysRoas = historicalMetrics.last3Days.roas;
    const prev4DaysRoas = this.calculatePrev4DaysRoas(
      historicalMetrics.last7Days,
      historicalMetrics.last3Days,
    );

    const trendDirection = last3DaysRoas < prev4DaysRoas ? 'declining' : 'improving';

    // Determine severity and action
    let decisionType: string;
    let confidence: number;
    let priority: number;
    let reasoning: string;

    if (currentRoas < this.ROAS_CRITICAL && trendDirection === 'declining') {
      // Critical: Pause immediately
      decisionType = 'PAUSE_CAMPAIGN';
      confidence = 95;
      priority = 10;
      reasoning = `Campaign has critical ROAS of ${currentRoas.toFixed(2)} (target: ${this.TARGET_ROAS}) with declining trend. Immediate action required to prevent further losses.`;
    } else if (currentRoas < this.TARGET_ROAS && trendDirection === 'declining') {
      // Warning: Reduce budget
      decisionType = 'DECREASE_BUDGET';
      confidence = 85;
      priority = 7;
      reasoning = `Campaign ROAS of ${currentRoas.toFixed(2)} is below target (${this.TARGET_ROAS}) with declining trend over last ${this.TREND_LOOKBACK_DAYS} days. Consider reducing budget by 30-50%.`;
    } else if (currentRoas < this.TARGET_ROAS) {
      // Monitor: Alert only
      decisionType = 'ALERT_BUDGET_INEFFICIENCY';
      confidence = 70;
      priority = 5;
      reasoning = `Campaign ROAS of ${currentRoas.toFixed(2)} is below target (${this.TARGET_ROAS}). Monitor closely for continued poor performance.`;
    } else {
      return this.noDecision('Campaign performance within acceptable range');
    }

    return {
      ruleName: this.name,
      ruleVersion: this.version,
      triggered: true,
      decisionType,
      confidence,
      priority,
      reasoning,
      metricsSnapshot: {
        current_roas: currentRoas,
        target_roas: this.TARGET_ROAS,
        last_7_days_spend: historicalMetrics.last7Days.spend,
        last_7_days_revenue: historicalMetrics.last7Days.revenue,
        last_3_days_roas: last3DaysRoas,
        prev_4_days_roas: prev4DaysRoas,
        trend: trendDirection,
        conversions: historicalMetrics.last7Days.conversions,
        cpa: historicalMetrics.last7Days.cpa,
      },
      proposedAction: {
        type: decisionType,
        campaignId: context.campaignId,
        currentBudget: campaignInfo.budgetAmount,
        ...(decisionType === 'DECREASE_BUDGET' && {
          proposedBudget: campaignInfo.budgetAmount * 0.5,
          budgetReduction: 50,
        }),
      },
    };
  }

  private noDecision(reason?: string): RuleDecision {
    return {
      ruleName: this.name,
      ruleVersion: this.version,
      triggered: false,
      confidence: 0,
      reasoning: reason || 'Rule conditions not met',
      metricsSnapshot: {},
      priority: 0,
    };
  }

  private calculatePrev4DaysRoas(last7Days: any, last3Days: any): number {
    const prev4DaysRevenue = last7Days.revenue - last3Days.revenue;
    const prev4DaysSpend = last7Days.spend - last3Days.spend;

    if (prev4DaysSpend === 0) return 0;
    return prev4DaysRevenue / prev4DaysSpend;
  }
}
