import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdAccountsModule } from './ad-accounts/ad-accounts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AdsModule } from './ads/ads.module';
import { MetricsModule } from './metrics/metrics.module';
import { DecisionsModule } from './decisions/decisions.module';
import { AiModule } from './ai/ai.module';
import { CreativesModule } from './creatives/creatives.module';
import { AgentModule } from './agent/agent.module';
import { GoogleAdsModule } from './integrations/google-ads/google-ads.module';
import { MetaAdsModule } from './integrations/meta-ads/meta-ads.module';
import { TikTokAdsModule } from './integrations/tiktok-ads/tiktok-ads.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Bull Queue for background jobs
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    }),

    // Core infrastructure
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    AdAccountsModule,
    CampaignsModule,
    AdsModule,
    MetricsModule,
    DecisionsModule,
    AiModule,
    CreativesModule,
    AgentModule,

    // Integration modules
    GoogleAdsModule,
    MetaAdsModule,
    TikTokAdsModule,

    // Background jobs
    JobsModule,
  ],
})
export class AppModule {}
