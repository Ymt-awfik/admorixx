import { Module } from '@nestjs/common';
import { DecisionEngineService } from './decision-engine.service';
import { DecisionsController } from './decisions.controller';
import { LosingCampaignRule } from './rules/losing-campaign.rule';
import { WinnerScalingRule } from './rules/winner-scaling.rule';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DecisionsController],
  providers: [
    DecisionEngineService,
    LosingCampaignRule,
    WinnerScalingRule,
  ],
  exports: [DecisionEngineService],
})
export class DecisionsModule {}
