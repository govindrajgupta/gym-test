import { IsString, MaxLength, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty({ example: '2024-07-24' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: '11:30:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, { message: 'start_time must be in HH:MM:SS format' })
  start_time: string;

  @ApiProperty({ example: '11:45:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, { message: 'end_time must be in HH:MM:SS format' })
  end_time: string;

  @ApiProperty({ example: 'PT' })
  @IsString()
  @MaxLength(100)
  session_name: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_repeat?: boolean;
}

export class BookSlotDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'availability_id must be a valid UUID',
  })
  availability_id: string;
}
