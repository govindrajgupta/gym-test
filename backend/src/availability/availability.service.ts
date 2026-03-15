import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getAvailability(trainerId: string) {
    const client = this.supabase.getClient();

    const { data: slots, error } = await client
      .from('trainer_availability')
      .select(`
        *,
        booked_slots (id, client_id, status)
      `)
      .eq('trainer_id', trainerId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      this.logger.error(`getAvailability failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch availability');
    }

    return slots;
  }

  async createAvailability(trainerId: string, dtos: CreateAvailabilityDto[]) {
    const client = this.supabase.getClient();

    const slotsToInsert = dtos.map((dto) => ({
      trainer_id: trainerId,
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      session_name: dto.session_name,
      is_repeat: dto.is_repeat ?? false,
    }));

    const { data, error } = await client
      .from('trainer_availability')
      .insert(slotsToInsert)
      .select();

    if (error) {
      this.logger.error(`createAvailability failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to create availability slots');
    }

    return data;
  }

  async bookSlot(clientId: string, availabilityId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('booked_slots')
      .insert({
        client_id: clientId,
        availability_id: availabilityId,
        status: 'booked',
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation means slot is already booked
      if (error.code === '23505') {
        throw new ConflictException('This slot has already been booked');
      }
      this.logger.error(`bookSlot failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to book slot');
    }

    return data;
  }

  async deleteAvailability(trainerId: string, slotId: string) {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('trainer_availability')
      .delete()
      .eq('id', slotId)
      .eq('trainer_id', trainerId);

    if (error) {
      this.logger.error(`deleteAvailability failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete availability slot');
    }

    return { success: true };
  }
}
