import { IsString, MaxLength, IsOptional, IsArray, ValidateNested, IsInt, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bench Press' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '3' })
  @IsString()
  @MaxLength(50)
  sets: string;

  @ApiProperty({ example: '8-12' })
  @IsString()
  @MaxLength(50)
  reps_or_time: string;

  @ApiPropertyOptional({ example: 'Slow negatives' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  @Max(100)
  order_index: number;
}

export class CreateDayDto {
  @ApiProperty({ example: 'Chest Day' })
  @IsString()
  @MaxLength(100)
  day_name: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  @Max(30)
  order_index: number;

  @ApiProperty({ type: [CreateExerciseDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseDto)
  exercises: CreateExerciseDto[];
}

export class CreateWorkoutDto {
  @ApiProperty({ example: "Beginner's Workout - 3 days" })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'A 3-day split for beginners' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ type: [CreateDayDto] })
  @IsArray()
  @ArrayMaxSize(14)
  @ValidateNested({ each: true })
  @Type(() => CreateDayDto)
  days: CreateDayDto[];
}
