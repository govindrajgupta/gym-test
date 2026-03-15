import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto, BookSlotDto } from './dto/create-availability.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { AuthUser } from '../common/auth-user.interface';

@ApiTags('Availability')
@ApiBearerAuth()
@Controller('availability')
@UseGuards(SupabaseAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all availability slots for the authenticated trainer' })
  getAvailability(@GetUser() user: AuthUser) {
    return this.availabilityService.getAvailability(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create one or more availability slots' })
  createAvailability(
    @GetUser() user: AuthUser,
    @Body() body: CreateAvailabilityDto[],
  ) {
    return this.availabilityService.createAvailability(user.id, body);
  }

  @Post('book')
  @ApiOperation({ summary: 'Book an available slot' })
  bookSlot(
    @GetUser() user: AuthUser,
    @Body() body: BookSlotDto,
  ) {
    return this.availabilityService.bookSlot(user.id, body.availability_id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an availability slot by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteAvailability(
    @GetUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.availabilityService.deleteAvailability(user.id, id);
  }
}
