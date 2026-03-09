import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreativesService, CreativeGenerationInput } from './creatives.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';

@ApiTags('Creatives')
@Controller('creatives')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreativesController {
  constructor(private creativesService: CreativesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate viral video ad creative ideas' })
  async generateCreative(
    @CurrentUser() user: CurrentUserData,
    @Body() input: CreativeGenerationInput,
  ) {
    const creative = await this.creativesService.generateCreative(
      user.userId,
      input,
    );

    return {
      success: true,
      data: creative,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user creatives with optional filters' })
  async getUserCreatives(
    @CurrentUser() user: CurrentUserData,
    @Query('platform') platform?: string,
    @Query('pattern') pattern?: string,
    @Query('isFavorite') isFavorite?: string,
  ) {
    const creatives = await this.creativesService.getUserCreatives(
      user.userId,
      {
        platform,
        pattern,
        isFavorite: isFavorite === 'true',
      },
    );

    return {
      success: true,
      count: creatives.length,
      data: creatives,
    };
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Get available creative patterns' })
  getPatterns() {
    const patterns = this.creativesService.getAvailablePatterns();

    return {
      success: true,
      count: patterns.length,
      data: patterns,
    };
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status' })
  async toggleFavorite(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    await this.creativesService.toggleFavorite(user.userId, id);

    return {
      success: true,
      message: 'Favorite status toggled',
    };
  }

  @Patch(':id/mark-used')
  @ApiOperation({ summary: 'Mark creative as used' })
  async markAsUsed(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    await this.creativesService.markAsUsed(user.userId, id);

    return {
      success: true,
      message: 'Creative marked as used',
    };
  }
}
