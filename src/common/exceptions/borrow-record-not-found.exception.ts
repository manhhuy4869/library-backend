import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class BorrowRecordNotFoundException extends NotFoundException {
  readonly errorCode = ErrorCode.BORROW_RECORD_NOT_FOUND;
  constructor() {
    super(ERROR_MESSAGES.BORROW_RECORD_NOT_FOUND);
  }
}
