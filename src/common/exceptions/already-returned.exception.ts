import { BusinessException } from './business.exception';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class AlreadyReturnedException extends BusinessException {
  constructor() {
    super(ERROR_MESSAGES.ALREADY_RETURNED, ErrorCode.ALREADY_RETURNED);
  }
}
