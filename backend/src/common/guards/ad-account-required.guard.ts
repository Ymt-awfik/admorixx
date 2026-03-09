import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard that ensures user has at least one connected ad account
 * Users without ad accounts are blocked from accessing protected routes
 */
@Injectable()
export class AdAccountRequiredGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route allows access without ad account (e.g., onboarding pages)
    const allowWithoutAdAccount = this.reflector.getAllAndOverride<boolean>(
      'allowWithoutAdAccount',
      [context.getHandler(), context.getClass()],
    );

    if (allowWithoutAdAccount) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has any connected ad accounts
    const adAccountCount = await this.prisma.adAccount.count({
      where: {
        userId: user.userId,
        isConnected: true,
        isActive: true,
      },
    });

    if (adAccountCount === 0) {
      throw new ForbiddenException(
        'You must connect at least one ad account to access this feature. Please visit /connect-ad-accounts',
      );
    }

    return true;
  }
}
