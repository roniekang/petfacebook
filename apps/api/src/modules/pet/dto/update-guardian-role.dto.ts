import { IsEnum } from 'class-validator';

enum UpdatableRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class UpdateGuardianRoleDto {
  @IsEnum(UpdatableRole)
  role: 'ADMIN' | 'MEMBER';
}
