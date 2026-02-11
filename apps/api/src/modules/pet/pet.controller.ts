import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PetService } from './pet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentGuardian } from '../../common/decorators/current-guardian.decorator';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { InviteGuardianDto } from './dto/invite-guardian.dto';
import { UpdateGuardianRoleDto } from './dto/update-guardian-role.dto';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  async create(
    @CurrentGuardian('id') guardianId: string,
    @Body() dto: CreatePetDto,
  ) {
    return this.petService.create(guardianId, dto);
  }

  @Get('mine')
  async findMine(@CurrentGuardian('id') guardianId: string) {
    return this.petService.findMine(guardianId);
  }

  @Get('invitations')
  async getInvitations(@CurrentGuardian('id') guardianId: string) {
    return this.petService.getInvitations(guardianId);
  }

  @Post('invitations/:id/accept')
  async acceptInvitation(
    @Param('id') id: string,
    @CurrentGuardian('id') guardianId: string,
  ) {
    return this.petService.acceptInvitation(id, guardianId);
  }

  @Post('invitations/:id/reject')
  async rejectInvitation(
    @Param('id') id: string,
    @CurrentGuardian('id') guardianId: string,
  ) {
    return this.petService.rejectInvitation(id, guardianId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.petService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentGuardian('id') guardianId: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.petService.update(id, guardianId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentGuardian('id') guardianId: string,
  ) {
    return this.petService.remove(id, guardianId);
  }

  // ===== Guardian Management =====

  @Post(':id/guardians/invite')
  async inviteGuardian(
    @Param('id') petAccountId: string,
    @CurrentGuardian('id') guardianId: string,
    @Body() dto: InviteGuardianDto,
  ) {
    return this.petService.inviteGuardian(petAccountId, dto.email, guardianId);
  }

  @Get(':id/guardians')
  async getGuardians(@Param('id') petAccountId: string) {
    return this.petService.getGuardians(petAccountId);
  }

  @Patch(':id/guardians/:guardianId/role')
  async updateGuardianRole(
    @Param('id') petAccountId: string,
    @Param('guardianId') targetGuardianId: string,
    @CurrentGuardian('id') requestingGuardianId: string,
    @Body() dto: UpdateGuardianRoleDto,
  ) {
    return this.petService.updateGuardianRole(
      petAccountId,
      targetGuardianId,
      dto.role,
      requestingGuardianId,
    );
  }

  @Delete(':id/guardians/:guardianId')
  async removeGuardian(
    @Param('id') petAccountId: string,
    @Param('guardianId') targetGuardianId: string,
    @CurrentGuardian('id') requestingGuardianId: string,
  ) {
    return this.petService.removeGuardian(
      petAccountId,
      targetGuardianId,
      requestingGuardianId,
    );
  }
}
