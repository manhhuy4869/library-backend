import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class BookCopyNotFoundException extends NotFoundException {
  readonly errorCode = ErrorCode.BOOK_COPY_NOT_FOUND;
  constructor() {
    super(ERROR_MESSAGES.BOOK_COPY_NOT_FOUND);
  }
}
