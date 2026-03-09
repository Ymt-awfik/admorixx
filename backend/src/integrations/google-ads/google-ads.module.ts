import { Module } from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsController } from './google-ads.controller';
import { EncryptionService } from '../../common/services/encryption.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GoogleAdsController],
  providers: [GoogleAdsService, EncryptionService],
  exports: [GoogleAdsService],
})
export class GoogleAdsModule {}
