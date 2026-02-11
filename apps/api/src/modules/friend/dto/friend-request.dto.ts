import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { FriendMethod } from '@pettopia/database';

export class FriendRequestDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsOptional()
  @IsEnum(FriendMethod)
  method?: FriendMethod;
}
