import { Module } from '@nestjs/common';
import { WalkController } from './walk.controller';
import { WalkService } from './walk.service';
import { PostModule } from '../post/post.module';

@Module({
  imports: [PostModule],
  controllers: [WalkController],
  providers: [WalkService],
  exports: [WalkService],
})
export class WalkModule {}
