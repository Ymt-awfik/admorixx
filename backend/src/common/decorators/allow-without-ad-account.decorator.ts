import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes that can be accessed without ad accounts
 * Used for onboarding flow (connect-ad-accounts page, etc.)
 */
export const AllowWithoutAdAccount = () => SetMetadata('allowWithoutAdAccount', true);
