import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { MediaType } from '@pettopia/database';

export class CreateStoryDto {
  @IsString()
  mediaUrl: string;

  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsOptional()
  @IsString()
  geoTag?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
