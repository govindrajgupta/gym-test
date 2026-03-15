import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { AuthUser } from '../common/auth-user.interface';

@ApiTags('Workouts')
@ApiBearerAuth()
@Controller('workouts')
@UseGuards(SupabaseAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workout plans for the authenticated trainer' })
  getWorkouts(@GetUser() user: AuthUser) {
    return this.workoutsService.getWorkouts(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workout plan with days and exercises' })
  createWorkout(
    @GetUser() user: AuthUser,
    @Body() createWorkoutDto: CreateWorkoutDto,
  ) {
    return this.workoutsService.createWorkout(user.id, createWorkoutDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workout plan by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteWorkout(
    @GetUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.workoutsService.deleteWorkout(user.id, id);
  }
}
