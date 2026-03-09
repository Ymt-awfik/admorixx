import { Injectable } from '@nestjs/common';
import {
  IDecisionRule,
  RuleContext,
  RuleDecision,
} from './base-rule.interface';

/**
 * RULE: Winner Protection & Scaling
 *
 * Triggers when:
 * - Campaign has strong ROAS (> 2.5x target)
 * - Consistent positive trend over 7+ days
 * - Good conversion volume (10+ conversions)
 * - Budget utilization is high (>80%)
 *
 * Action: Propose safe budget increase (20% increments)
 */
@Injectable()
export class WinnerScalingRule implements IDecisionRule {
  name = 'winner_scaling';
  version = '1.0.0';
  description = 'Identifies high-performing campaigns ready for safe scaling';

  private readonly EXCELLENT_ROAS = 3.0; // Excellent ROAS threshold
  private readonly GOOD_ROAS = 2.0; // Good ROAS threshold
  private readonly MIN_CONVERSIONS = 10; // Minimum conversions for confidence
  private readonly BUDGET_UTILIZATION = 0.8; // 80% budget utilization
  private readonly SAFE_SCALE_PERCENT = 20; // Scale by 20%
  private readonly AGGRESSIVE_SCALE_PERCENT = 30; // Aggressive scale

  async evaluate(context: RuleContext): Promise<RuleDecision> {
    const { metrics, historicalMetrics, campaignInfo } = context;

    // Skip if campaign is not enabled
    if (campaignInfo.status !== 'ENABLED') {
      return this.noDecision('Campaign not enabled');
    }

    // Check minimum performance requirements
    const last7DaysMetrics = historicalMetrics.last7Days;

    if (last7DaysMetrics.conversions < this.MIN_CONVERSIONS) {
      return this.noDecision('Insufficient conversion volume for scaling');
    }

    if (last7DaysMetrics.roas < this.GOOD_ROAS) {
      return this.noDecision('ROAS below scaling threshold');
    }

    // Check trend consistency (ROAS should be stable or improving)
    const last3DaysRoas = historicalMetrics.last3Days.roas;
    const last7DaysRoas = historicalMetrics.last7Days.roas;
    const last14DaysRoas = historicalMetrics.last14Days.roas;

    const isConsistent = this.checkConsistency([
      last3DaysRoas,
      last7DaysRoas,
      last14DaysRoas,
    ]);

    if (!isConsistent) {
      return this.noDecision('Performance not consistent enough for scaling');
    }

    // Check budget utilization (only scale if budget is being used)
    const budgetUtilization = campaignInfo.budgetAmount
      ? last7DaysMetrics.spend / (campaignInfo.budgetAmount * 7)
      : 0;

    if (budgetUtilization < this.BUDGET_UTILIZATION) {
      return this.noDecision('Budget not fully utilized');
    }

    // Determine scaling strategy
    let scalePercent: number;
    let confidence: number;
    let priority: number;
    let reasoning: string;

    if (
      last7DaysRoas >= this.EXCELLENT_ROAS &&
      last3DaysRoas >= this.EXCELLENT_ROAS
    ) {
      // Aggressive scaling for excellent performers
      scalePercent = this.AGGRESSIVE_SCALE_PERCENT;
      confidence = 95;
      priority = 9;
      reasoning = `Campaign is an exceptional performer with ROAS of ${last7DaysRoas.toFixed(2)} (target: 2.0+). Performance is consistent across 14 days with ${last7DaysMetrics.conversions} conversions. Safe to scale budget by ${scalePercent}%.`;
    } else if (last7DaysRoas >= this.GOOD_ROAS) {
      // Conservative scaling for good performers
      scalePercent = this.SAFE_SCALE_PERCENT;
      confidence = 85;
      priority = 7;
      reasoning = `Campaign shows strong performance with ROAS of ${last7DaysRoas.toFixed(2)}. Consistent trend with ${last7DaysMetrics.conversions} conversions. Recommend conservative ${scalePercent}% budget increase.`;
    } else {
      return this.noDecision('Performance metrics do not meet scaling criteria');
    }

    const currentBudget = campaignInfo.budgetAmount || 0;
    const proposedBudget = currentBudget * (1 + scalePercent / 100);
    const budgetIncrease = proposedBudget - currentBudget;

    return {
      ruleName: this.name,
      ruleVersion: this.version,
      triggered: true,
      decisionType: 'INCREASE_BUDGET',
      confidence,
      priority,
      reasoning,
      metricsSnapshot: {
        last_7_days_roas: last7DaysRoas,
        last_3_days_roas: last3DaysRoas,
        last_14_days_roas: last14DaysRoas,
        conversions: last7DaysMetrics.conversions,
        spend: last7DaysMetrics.spend,
        revenue: last7DaysMetrics.revenue,
        cpa: last7DaysMetrics.cpa,
        budget_utilization: (budgetUtilization * 100).toFixed(1),
        consistency_score: this.calculateConsistencyScore([
          last3DaysRoas,
          last7DaysRoas,
          last14DaysRoas,
        ]),
      },
      proposedAction: {
        type: 'INCREASE_BUDGET',
        campaignId: context.campaignId,
        currentBudget,
        proposedBudget,
        budgetIncrease,
        scalePercent,
        rationale: 'High-performing campaign with consistent results',
        safetyChecks: {
          minRoas: this.GOOD_ROAS,
          minConversions: this.MIN_CONVERSIONS,
          trendCheck: 'passed',
          budgetUtilization: `${(budgetUtilization * 100).toFixed(1)}%`,
        },
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

  /**
   * Check if ROAS is consistent (low volatility)
   */
  private checkConsistency(roasValues: number[]): boolean {
    if (roasValues.length < 2) return false;

    const avg = roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
    const variance =
      roasValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      roasValues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    // CV < 0.3 indicates low volatility (consistent performance)
    return coefficientOfVariation < 0.3;
  }

  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistencyScore(roasValues: number[]): number {
    if (roasValues.length < 2) return 0;

    const avg = roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
    const variance =
      roasValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      roasValues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    // Convert CV to score (lower CV = higher score)
    const score = Math.max(0, 100 - coefficientOfVariation * 200);
    return Math.round(score);
  }
}
