import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleAdsModule } from '../integrations/google-ads/google-ads.module';

@Module({
  imports: [PrismaModule, GoogleAdsModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
