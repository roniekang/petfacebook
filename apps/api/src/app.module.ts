import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { PetModule } from "./modules/pet/pet.module";
import { PostModule } from "./modules/post/post.module";
import { StoryModule } from "./modules/story/story.module";
import { FriendModule } from "./modules/friend/friend.module";
import { CommunityModule } from "./modules/community/community.module";
import { WalkModule } from "./modules/walk/walk.module";
import { ServiceModule } from "./modules/service/service.module";
import { HavenModule } from "./modules/haven/haven.module";
import { SearchModule } from "./modules/search/search.module";
import { CoinModule } from "./modules/coin/coin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
