import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { PrismaService } from '../prisma.service';

// Validator BẤT ĐỒNG BỘ - gọi thẳng DB kiểm tra trùng, khác các validator thường
// (chỉ kiểm tra hình thức chuỗi/số). Cần main.ts bật useContainer() để Nest tự
// inject PrismaService vào class này (class-validator mặc định không có DI).
@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [model, field] = args.constraints as [string, string];
    const record = await (this.prisma as any)[model].findUnique({ where: { [field]: value } });
    return !record;
  }

  defaultMessage(args: ValidationArguments): string {
    const [, field] = args.constraints as [string, string];
    return `${field} "${args.value}" đã tồn tại`;
  }
}

// Dùng: @IsUnique('reader', 'studentCode') trên field DTO cần kiểm tra không trùng
export function IsUnique(model: string, field: string, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [model, field],
      validator: UniqueConstraint,
    });
  };
}
