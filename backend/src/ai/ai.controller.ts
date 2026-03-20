import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { SuggestAlertDto } from './dto/suggest-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRequiredGuard } from '../common/guards/org-required.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard, OrgRequiredGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('alerts/suggest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suggest alert title and description from a draft (OpenAI; model fallback chain)',
  })
  async suggestAlert(@Body() dto: SuggestAlertDto) {
    return this.aiService.suggestAlertContent(dto.title);
  }
}
