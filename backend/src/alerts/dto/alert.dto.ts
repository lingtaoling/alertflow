import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateAlertDto {
  @ApiProperty({ example: 'Database CPU spike', minLength: 3, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'CPU usage exceeded 90% threshold' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateAlertStatusDto {
  @ApiProperty({ enum: AlertStatus, description: 'Must follow: NEW → ACKNOWLEDGED → RESOLVED' })
  @IsEnum(AlertStatus)
  @IsIn(['ACKNOWLEDGED', 'RESOLVED'], {
    message: 'Status must be ACKNOWLEDGED or RESOLVED',
  })
  status: AlertStatus;

  @ApiProperty({
    example: 1,
    description: 'The version number the client last saw. Used for optimistic locking.',
  })
  @IsInt()
  @Min(1)
  version: number;

  @ApiPropertyOptional({ example: 'Investigated and confirmed. Assigning to team.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListAlertsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;
}
