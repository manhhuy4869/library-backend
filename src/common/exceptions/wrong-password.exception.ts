import { BusinessException } from './business.exception';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class WrongPasswordException extends BusinessException {
  constructor() {
    super(ERROR_MESSAGES.WRONG_OLD_PASSWORD, ErrorCode.WRONG_OLD_PASSWORD);
  }
}
