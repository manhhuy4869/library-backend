import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { PrismaService } from '../prisma.service';

// Ngược lại UniqueConstraint - kiểm tra bản ghi PHẢI TỒN TẠI. Dùng khi DTO nhận
// foreign key (bookId, readerId, copyId...) để báo lỗi validate NGAY, thay vì để
// lọt xuống service rồi mới ném BookNotFoundException riêng lẻ từng chỗ.
@ValidatorConstraint({ name: 'EntityExists', async: true })
@Injectable()
export class EntityExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [model] = args.constraints as [string];
    const record = await (this.prisma as any)[model].findUnique({ where: { id: value } });
    return !!record;
  }

  defaultMessage(args: ValidationArguments): string {
    const [model] = args.constraints as [string];
    return `${model} với id "${args.value}" không tồn tại`;
  }
}

// Dùng: @EntityExists('book') trên field bookId - validate ngay ở DTO, không phải
// query lại ở service để check tồn tại
export function EntityExists(model: string, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [model],
      validator: EntityExistsConstraint,
    });
  };
}
