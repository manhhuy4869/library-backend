import { BusinessException } from './business.exception';
import { ERROR_MESSAGES } from '../../constants/error-messages.constants';
import { ErrorCode } from '../../constants/error-code.constant';

export class CopyNotAvailableException extends BusinessException {
  constructor() {
    super(ERROR_MESSAGES.COPY_NOT_AVAILABLE, ErrorCode.COPY_NOT_AVAILABLE);
  }
}
