import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class ReaderNotFoundException extends NotFoundException {
  readonly errorCode = ErrorCode.READER_NOT_FOUND;
  constructor() {
    super(ERROR_MESSAGES.READER_NOT_FOUND);
  }
}
