import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateWorkoutDto } from './dto/create-workout.dto';

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getWorkouts(userId: string) {
    const client = this.supabase.getClient();

    const { data: plans, error } = await client
      .from('workout_plans')
      .select(`
        *,
        workout_days (
          *,
          exercises (*)
        )
      `)
      .eq('trainer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getWorkouts failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch workouts');
    }

    return plans;
  }

  async createWorkout(userId: string, dto: CreateWorkoutDto) {
    const client = this.supabase.getClient();

    // Insert the workout plan
    const { data: plan, error: planError } = await client
      .from('workout_plans')
      .insert({
        trainer_id: userId,
        name: dto.name,
        description: dto.description,
      })
      .select()
      .single();

    if (planError) {
      this.logger.error(`createWorkout plan insert failed: ${planError.message}`);
      throw new InternalServerErrorException('Failed to create workout plan');
    }

    // Insert days and exercises
    for (const day of dto.days) {
      const { data: savedDay, error: dayError } = await client
        .from('workout_days')
        .insert({
          plan_id: plan.id,
          day_name: day.day_name,
          order_index: day.order_index,
        })
        .select()
        .single();

      if (dayError) {
        this.logger.error(`createWorkout day insert failed: ${dayError.message}`);
        throw new InternalServerErrorException('Failed to create workout day');
      }

      if (day.exercises?.length > 0) {
        const exercisesToInsert = day.exercises.map((ex) => ({
          day_id: savedDay.id,
          name: ex.name,
          sets: ex.sets,
          reps_or_time: ex.reps_or_time,
          notes: ex.notes,
          order_index: ex.order_index,
        }));

        const { error: exError } = await client
          .from('exercises')
          .insert(exercisesToInsert);

        if (exError) {
          this.logger.error(`createWorkout exercises insert failed: ${exError.message}`);
          throw new InternalServerErrorException('Failed to create exercises');
        }
      }
    }

    return plan;
  }

  async deleteWorkout(userId: string, planId: string) {
    const client = this.supabase.getClient();

    // RLS + trainer_id check ensures only the owner can delete
    const { error } = await client
      .from('workout_plans')
      .delete()
      .eq('id', planId)
      .eq('trainer_id', userId);

    if (error) {
      this.logger.error(`deleteWorkout failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete workout');
    }

    return { success: true };
  }
}
