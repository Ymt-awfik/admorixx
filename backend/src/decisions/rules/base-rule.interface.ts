/**
 * Base interface for all decision rules
 * All rules must be deterministic and explainable
 */

export interface RuleContext {
  campaignId: string;
  adAccountId: string;
  userId: string;
  metrics: CampaignMetrics;
  historicalMetrics: HistoricalMetrics;
  campaignInfo: CampaignInfo;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface HistoricalMetrics {
  last3Days: CampaignMetrics;
  last7Days: CampaignMetrics;
  last14Days: CampaignMetrics;
  last30Days: CampaignMetrics;
}

export interface CampaignInfo {
  name: string;
  status: string;
  budgetAmount?: number;
  budgetType?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RuleDecision {
  ruleName: string;
  ruleVersion: string;
  triggered: boolean;
  decisionType?: string;
  confidence: number; // 0-100
  reasoning: string;
  metricsSnapshot: any;
  proposedAction?: any;
  priority: number; // 1-10 (10 = highest)
}

export interface IDecisionRule {
  name: string;
  version: string;
  description: string;
  evaluate(context: RuleContext): Promise<RuleDecision>;
}
