import { Module } from '@nestjs/common';
import { TikTokAdsController } from './tiktok-ads.controller';
import { TikTokAdsService } from './tiktok-ads.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [PrismaModule],
  controllers: [TikTokAdsController],
  providers: [TikTokAdsService, EncryptionService],
  exports: [TikTokAdsService],
})
export class TikTokAdsModule {}
