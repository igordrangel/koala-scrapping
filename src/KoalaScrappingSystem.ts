import { delay } from '@koalarx/utils/operators/delay';
import { KoalaSystemConfigInterface } from './interfaces/KoalaSystemConfigInterface';
import { ResponseInterface } from './interfaces/ResponseInterface';
import { KoalaScrappingDom } from './KoalaScrappingDom';

export abstract class KoalaScrappingSystem<CustomDataType> extends KoalaScrappingDom<CustomDataType> {
  private _headless: boolean;
  private _devTools: boolean = false;

  protected constructor(protected options: KoalaSystemConfigInterface<CustomDataType>) {
    super(options);
  }

  public messagesResponse: ResponseInterface[] = [];

  public async login(headless: boolean = true, verifyAuth: boolean = true) {
    this._headless = headless;
    await this.init(headless, this._devTools);

    if (this.options.customFn) {
      await this.options.customFn();
    } else {
      if (this.options.login && this.options.password) await this.authenticate();
    }
    await delay(301);

    if (this.options.xPathSubmit) {
      await this.click(this.options.xPathSubmit);
      await delay(1000);

      if (verifyAuth) {
        await this.verifyAuth(headless);
      }
    }
  }

  public setDevTools(devTools: boolean) {
    this._devTools = devTools;
  }

  public async logout() {
    if (this.options.customLogout) {
      await this.options.customLogout();
      await this.waitElementIsVisible(this.options.xPathSubmit, 20000);
    }
  }

  protected async logoutByList(xPaths: string[]) {
    for (const xPathBtnLogout of xPaths.values()) {
      if (await this.existElement(xPathBtnLogout, 5000)) {
        await this.click(xPathBtnLogout);
      }
    }
  }

  protected async verifyErrorLogin() {
    let message: string;

    if (this.options.haveAlertError || this.options.haveAlertError === undefined) {
      message = await this.getMessageAlert();

      if (message && !this.verifyIgnoredMessage(message)) {
        if (this.options.password.xPath) {
          await this.clearInput(this.options.password.xPath);
        }
        throw new TypeError(message);
      }
    }

    if (
      (this._headless ||
        !this.options.xPathToken ||
        (this.options.xPathToken && !(await this.existElement(this.options.xPathToken)))) &&
      this.options.xPathErrors
    ) {
      for (const error of this.options.xPathErrors) {
        if (await this.existElement(error)) {
          await this.displayVisible(error);
          await this.getTextContentOnElement(error)
            .then(async (m) => {
              if (this.options.password.xPath) {
                await this.clearInput(this.options.password.xPath);
              }

              if (!this.verifyIgnoredMessage(m)) {
                throw new TypeError(m);
              }
              if (this.options.messagesLoginAgain) {
                for (const msg of this.options.messagesLoginAgain.values()) {
                  if (this.containsInString(m, msg)) {
                    await this.login(this._headless);
                  }
                }
              }
            })
            .catch((e) => {
              throw e;
            });
        }
      }
    }
  }

  private verifyIgnoredMessage(m: string): boolean {
    let haveIgnoredMessages = false;
    if (this.options.ignoredMessages) {
      for (const msg of this.options.ignoredMessages.values()) {
        if (this.containsInString(m, msg)) {
          haveIgnoredMessages = true;
          break;
        }
      }
    }

    return haveIgnoredMessages;
  }

  protected async verifyAuth(headless: boolean) {
    let nVerifyAuth = 0;
    let stopVerifyAuth = false;
    do {
      if (await this.existElement(this.options.xPathSubmit)) {
        if ((await this.existElementOnList(this.options.xPathErrors ?? [])) || nVerifyAuth >= 10) {
          stopVerifyAuth = true;
          if (await this.existElement(this.options.xPathSubmit)) {
            await this.verifyErrorLogin();
          }
        } else {
          nVerifyAuth++;
        }
      } else {
        stopVerifyAuth = true;
      }
      await delay(500);
    } while (!stopVerifyAuth);
  }

  protected async verifyModalAndClose(
    xPathModal: string,
    xPathCloseButtonModal: string,
    messageAdd: string = '',
  ): Promise<boolean> {
    let success: boolean = true;
    await delay(1000);
    if (await this.existElement(xPathModal)) {
      await this.messagesResponse.push({
        message: (await this.getTextContentOnElement(xPathModal)) + messageAdd,
        error: true,
      });
      await this.click(xPathCloseButtonModal, 0);
      success = false;
    }
    return success;
  }

  protected async conclusion(messageSystem: string, messageComparation: string, data?: any): Promise<boolean> {
    await delay(1000);
    let isValid: boolean = true;

    if (!messageSystem) {
      isValid = false;
    } else {
      if (messageSystem.indexOf(messageComparation) < 0) {
        isValid = false;
      }
    }

    if (isValid) {
      await this.messagesResponse.push({
        message: 'Sucesso!',
        error: false,
        data,
      });
    } else {
      await this.messagesResponse.push({
        message: messageSystem,
        error: false,
        data,
      });
    }
    return isValid;
  }

  public setMessageRetorno(message: string, error: boolean, data?: any) {
    this.messagesResponse.push({
      message,
      error,
      data,
    });
  }

  protected getPartialMessage(value: string, identify: string) {
    return value.split('\n').find((part) => part.indexOf(identify) >= 0);
  }

  protected containsInString(message: string, comparisonMessage: string): boolean {
    if (message) {
      return message.indexOf(comparisonMessage) >= 0;
    } else {
      return false;
    }
  }
}
