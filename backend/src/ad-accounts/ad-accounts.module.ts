import { Module } from '@nestjs/common';
import { AdAccountsService } from './ad-accounts.service';
import { AdAccountsController } from './ad-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdAccountsController],
  providers: [AdAccountsService],
  exports: [AdAccountsService],
})
export class AdAccountsModule {}
