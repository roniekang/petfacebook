import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile() {
    return this.userService.getProfile();
  }

  @Patch('me')
  async updateProfile(@Body() body: { nickname?: string; avatarUrl?: string }) {
    return this.userService.updateProfile(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
