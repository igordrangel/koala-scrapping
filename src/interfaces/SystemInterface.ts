import { BrowserEnum } from '../enums/BrowserEnum';

export interface SystemInterface<SystemType> {
  systemType: SystemType;
  login: string;
  password: string;
  autoResolveCaptcha?: boolean;
  devTools?: boolean;
  browser?: BrowserEnum;
  headless?: boolean;
}
