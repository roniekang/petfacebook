import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentGuardian } from '../../common/decorators/current-guardian.decorator';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentGuardian('id') guardianId: string) {
    return this.userService.getProfile(guardianId);
  }

  @Patch('me')
  async updateProfile(
    @CurrentGuardian('id') guardianId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(guardianId, dto);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentGuardian('id') guardianId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(guardianId, dto);
  }

  @Delete('me')
  async deleteAccount(@CurrentGuardian('id') guardianId: string) {
    return this.userService.deleteAccount(guardianId);
  }
}
