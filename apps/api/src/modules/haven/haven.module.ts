import { Module } from '@nestjs/common';
import { HavenController } from './haven.controller';
import { HavenService } from './haven.service';

@Module({
  controllers: [HavenController],
  providers: [HavenService],
  exports: [HavenService],
})
export class HavenModule {}
