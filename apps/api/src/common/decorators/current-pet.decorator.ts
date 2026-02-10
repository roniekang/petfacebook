import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentPet = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const pet = request.petAccount;
    return data ? pet?.[data] : pet;
  }
);
