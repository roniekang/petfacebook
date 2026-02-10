import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ServiceService } from './service.service';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async list() {
    return this.serviceService.list();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Post()
  async create(@Body() body: { name: string; type: string; description?: string }) {
    return this.serviceService.create(body);
  }
}
