import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SuggestAlertDto {
  @ApiProperty({ description: 'Draft keywords or rough title (3–200 chars)', maxLength: 200 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'need more word to accurirate generage' })
  @MaxLength(200)
  title!: string;
}
