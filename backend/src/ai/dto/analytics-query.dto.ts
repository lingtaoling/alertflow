import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiProperty({ description: 'User question about alert analytics (3–4000 chars)', maxLength: 4000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'Query must be at least 3 characters' })
  @MaxLength(4000)
  query!: string;
}
