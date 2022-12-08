import { BrowserEnum } from '../enums/BrowserEnum';
import { CaptchaConfigInterface } from './CaptchaConfigInterface';
import { SendKeysInterface } from './SendKeysInterface';

export interface KoalaSystemConfigInterface<CustomDataType> {
  url: string;
  gotoAuth?: Buffer;
  login?: SendKeysInterface;
  password?: SendKeysInterface;
  xPathSubmit?: string;
  xPathErrors?: string[];
  xPathToken?: string;
  customFn?: () => void;
  browser?: BrowserEnum;
  slowMo?: number;
  customLogout?: () => void;
  ignoredMessages?: string[];
  errorMessages?: string[];
  messagesLoginAgain?: string[];
  haveAlertError?: boolean;
  blockReloadPage?: boolean;
  loadMinimalist?: boolean;
  customData?: CustomDataType;
  captchaConfig?: CaptchaConfigInterface;
  allowDownload?: boolean;
  downloadPath?: string;
  proxy?: {
    host: string;
    username?: string;
    password?: string;
  };
}
