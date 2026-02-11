import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { PetAccountInterceptor } from './common/interceptors/pet-account.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PetModule } from './modules/pet/pet.module';
import { PostModule } from './modules/post/post.module';
import { StoryModule } from './modules/story/story.module';
import { FriendModule } from './modules/friend/friend.module';
import { CommunityModule } from './modules/community/community.module';
import { WalkModule } from './modules/walk/walk.module';
import { ServiceModule } from './modules/service/service.module';
import { HavenModule } from './modules/haven/haven.module';
import { SearchModule } from './modules/search/search.module';
import { CoinModule } from './modules/coin/coin.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: path.join(__dirname, '..', '..', '..', '.env') }),
    PrismaModule,
    AuthModule,
    UserModule,
    PetModule,
    PostModule,
    StoryModule,
    FriendModule,
    CommunityModule,
    WalkModule,
    ServiceModule,
    HavenModule,
    SearchModule,
    CoinModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PetAccountInterceptor,
    },
  ],
})
export class AppModule {}
