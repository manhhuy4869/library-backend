import { BusinessException } from './business.exception';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class BorrowLimitExceededException extends BusinessException {
  constructor() {
    super(ERROR_MESSAGES.READER_BORROW_LIMIT, ErrorCode.BORROW_LIMIT_EXCEEDED);
  }
}
