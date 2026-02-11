import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteGuardianDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
