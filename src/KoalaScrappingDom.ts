import puppeteer from 'puppeteer-extra';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import { Browser, ElementHandle, Frame, Page } from 'puppeteer';
import { KoalaSystemConfigInterface } from './interfaces/KoalaSystemConfigInterface';
import { BrowserEnum } from './enums/BrowserEnum';
import { delay } from '@koalarx/utils/operators/delay';
import { toCamelCase } from '@koalarx/utils/operators/string';

import htmlTableToJson from 'html-table-to-json';
import { CaptchaDecodeInterface } from './interfaces/CaptchaDecodeInterface';
import { TwoCaptchaService } from './services/2captcha/TwoCaptchaService';
import fs from 'fs';
import path from 'path';

export abstract class KoalaScrappingDom<CustomDataType> {
  protected browser: Browser;
  protected page: Page;
  protected idCaptcha: string;
  private mensagemAlert: string;
  private _offDialog: boolean = false;

  /**
   * @param option | URl da página de início do processo
   */
  protected constructor(private option: KoalaSystemConfigInterface<CustomDataType>) {}

  public async closeDOM() {
    if (this.browser.isConnected()) {
      if (this.option.allowDownload && fs.existsSync(this.option.downloadPath)) {
        fs.rmSync(this.option.downloadPath, { recursive: true });
      }

      await delay(300);
      await this.browser.close();
    }
  }

  public async reloadPage() {
    if (!this.option.blockReloadPage) {
      await this.page.reload({
        timeout: 240000,
      });
    }
  }

  public blockReloadPage(block: boolean) {
    this.option.blockReloadPage = block;
  }

  public async offDialog() {
    this._offDialog = true;
  }

  public async decodeCaptcha(options: CaptchaDecodeInterface) {
    const b64ImageCaptcha = await this.page
      .waitForXPath(options.xPathIframeImage)
      .then(async (el: ElementHandle<HTMLIFrameElement>) => {
        return (await el.screenshot({ encoding: 'base64', type: 'png' })) as string;
      })
      .catch((e) => {
        throw e;
      });

    let textCaptcha: string;
    switch (options.enterprise) {
      case '2Captcha':
        const twoCaptcha = await TwoCaptchaService.init(this.option.captchaConfig.token)
          .solve({
            image: b64ImageCaptcha,
            maxAttempts: 60,
          })
          .catch((e) => {
            throw e;
          });
        textCaptcha = twoCaptcha.text;
        this.idCaptcha = twoCaptcha.id;
        break;
      default:
        throw new Error('Empresa de quebra de captcha não suportado.');
    }
    if (textCaptcha) {
      await this.pasteValueInField(options.xPathInputCaptcha, textCaptcha);
    }
  }

  public async decodeRecaptcha() {
    return this.page.solveRecaptchas();
  }

  public async waitDownloadFiles() {
    if (fs.existsSync(this.option.downloadPath)) {
      let contentDir = [];

      do {
        await delay(1000);
        contentDir = fs.readdirSync(this.option.downloadPath);
      } while (contentDir.filter((filepath) => filepath.indexOf('.crdownload') >= 0).length > 0);
    }
  }

  public getDownloadedFiles() {
    if (fs.existsSync(this.option.downloadPath)) {
      const contentDir = fs.readdirSync(this.option.downloadPath);
      const files: Buffer[] = [];

      contentDir.forEach((filepath) => files.push(fs.readFileSync(`${this.option.downloadPath}/${filepath}`)));
      return files;
    }

    return [];
  }

  protected async openTab(url: string) {
    this.page = await this.browser.newPage();
    await this.initObservableDialog();
    await this.goTo(url);
  }

  protected async getLastPage(): Promise<Page> {
    return (await this.browser.pages())[(await this.browser.pages()).length - 1];
  }

  protected async getDataFromTable(xPath: string): Promise<object[]> {
    return await this.getTable(xPath).then(async (tableHtml) => {
      const tmpResult = htmlTableToJson.parse(tableHtml).results[0];
      const result: object[] = [];
      tmpResult.forEach((obj: { [key: string]: string }) => {
        const newObj: { [key: string]: string } = {};
        Object.keys(obj).forEach((key) => {
          let value = obj[key];
          if (value.indexOf('/', 2) >= 0 && value.indexOf('/', 5) >= 0 && value.length === 10) {
            const arrValue = value.split('/');
            value = `${arrValue[2]}-${arrValue[1]}-${arrValue[0]}`;
          }

          newObj[toCamelCase(key)] = value;
        });
        result.push(newObj);
      });
      return result;
    });
  }

  protected async switchLastTab() {
    this.page = await this.getLastPage();
    await this.initObservableDialog();
  }

  protected async closeTab() {
    await this.page.close();
    this.page = await this.getLastPage();
  }

  protected async goTo(url: string) {
    await this.page.goto(url, { timeout: 0, waitUntil: 'load' }).catch((e) => {
      throw e;
    });
  }

  protected async clearInput(xpath: string) {
    await this.page
      .waitForXPath(xpath)
      .then(async (el: ElementHandle<HTMLInputElement | HTMLTextAreaElement>) => {
        await el.evaluate((input) => {
          input.value = '';
        });
      })
      .catch((e) => {
        throw e;
      });
  }

  protected async pasteValueInField(
    xPath: string,
    keys: string,
    displayNone: boolean = false,
    hardValidation: boolean = false,
    valueFix: boolean = false,
  ) {
    if (await this.existElement(xPath)) {
      await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement>) => {
        await el.evaluate(
          (input, value: string, elDisplayNone: boolean) => {
            input.maxLength = 600;
            input.value = value;
            if (elDisplayNone) {
              input.style.color = 'transparent';
            }
          },
          keys,
          displayNone,
        );

        if (valueFix) {
          await this.writeTextInField(xPath, '0');
          await this.keyboardPress(xPath, 'Backspace');
        }

        if (hardValidation) {
          await delay(2000);
          const current = await this.getTextContentOnInputElement(xPath);
          if (current !== keys) {
            await this.pasteValueInField(xPath, keys, displayNone, hardValidation);
          }
        }
      });
    }
  }

  protected async writeTextInField(xPath: string, value: string) {
    await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement | HTMLTextAreaElement>) => {
      await el.focus();
      await el.type(value, { delay: 20 });
    });
  }

  protected async authenticate() {
    if (this.option.browser !== BrowserEnum.firefox) {
      await this.pasteValueInField(this.option.login.xPath, this.option.login.value, true, false);
      await this.pasteValueInField(this.option.password.xPath, this.option.password.value, true, false);
    } else {
      await this.sendKeys(this.option.login.xPath, this.option.login.value, true, false);
      await this.sendKeys(this.option.password.xPath, this.option.password.value, true, false);
    }
  }

  protected async init(headless: boolean = true, devtools: boolean = false) {
    if (!this.browser) {
      const args = [
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
        '--disable-setuid-sandbox',
        '-wait-for-browser',
      ];
      if (!headless) args.push('--start-maximized');
      const launchOptions: any = {
        headless,
        devtools,
        timeout: 60000,
        defaultViewport: null,
        args,
        slowMo: this.option?.slowMo ?? 0,
        userDataDir: './puppeteer-cache',
      };

      if (this.option?.captchaConfig) {
        puppeteer.use(
          RecaptchaPlugin({
            provider: {
              id: this.option.captchaConfig?.id,
              token: this.option.captchaConfig?.token,
            },
            visualFeedback: true,
          }),
        );
      }

      if (!this.option.browser || this.option.browser === BrowserEnum.chromium) {
        launchOptions.product = 'chrome';
      } else {
        throw new TypeError('No momento este navegador não é suportado.');
      }

      this.browser = await puppeteer.launch(launchOptions);

      this.page = await this.getLastPage();
      await this.initObservableDialog();

      await this.goTo(this.option.url);
      if (this.option.browser === BrowserEnum.firefox) {
        await this.page.click('body');
      }
      if (!headless && this.option.browser !== BrowserEnum.firefox) {
        await this.page.removeAllListeners('request');
        await this.page.setRequestInterception(this.option.loadMinimalist ?? false);

        if (this.option.loadMinimalist) {
          this.page.on('request', (req) => {
            if (
              req.resourceType() === 'stylesheet' ||
              req.resourceType() === 'font' ||
              req.resourceType() === 'image'
            ) {
              req.abort();
            } else {
              req.continue();
            }
          });
        }
      }
      if (this.option.allowDownload) {
        if (!this.option.downloadPath) this.option.downloadPath = path.resolve('./download');
        this.page.client().send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: this.option.downloadPath,
        });
      }
    }
  }

  protected async waitForXpathIsNotVisible(xPath: string, waitFor: number = 2000) {
    let isVisible: boolean = true;
    while (isVisible) {
      await delay(waitFor);
      isVisible = await this.existElement(xPath);
    }
  }

  protected async displayNone(xpath: string) {
    await this.page.waitForXPath(xpath).then(async (el: ElementHandle<HTMLInputElement | HTMLLabelElement>) => {
      await el.evaluate((input) => {
        input.style.display = 'none';
      });
    });
  }

  protected async displayVisible(xpath: string) {
    await this.page.waitForXPath(xpath).then(async (el: ElementHandle<HTMLInputElement | HTMLLabelElement>) => {
      await el.evaluate((input) => {
        input.style.removeProperty('display');
      });
    });
  }

  protected async getTextContentOnElement(xPath: string, delayUntil: number = 1000): Promise<string> {
    return await this.page
      .waitForXPath(xPath, {
        visible: true,
        timeout: delayUntil,
      })
      .then(
        async (
          el: ElementHandle<
            HTMLSpanElement | HTMLDivElement | HTMLParagraphElement | HTMLLIElement | HTMLButtonElement
          >,
        ) => {
          return await el
            .evaluate((div) => {
              return div.textContent;
            })
            .catch((e) => {
              throw e;
            });
        },
      )
      .catch((e) => {
        throw e;
      });
  }

  protected async getTextContentOnInputElement(xPath: string): Promise<string> {
    return await this.page
      .waitForXPath(xPath, {
        visible: true,
        timeout: 1000,
      })
      .then(async (el: ElementHandle<HTMLInputElement | HTMLTextAreaElement>) => {
        return await el
          .evaluate((input) => {
            return input.value;
          })
          .catch((e) => {
            throw e;
          });
      })
      .catch((e) => {
        throw e;
      });
  }

  protected existElementOnList(xPathList: string[], containsMessageError: string[] = [], delayUntil: number = 5000) {
    return new Promise<boolean>(async (resolve) => {
      let elementExist = false;
      for (const xPath of xPathList.values()) {
        if (await this.existElement(xPath, delayUntil)) {
          const message = await this.getTextContentOnElement(xPath);
          if (containsMessageError.length === 0 || containsMessageError.indexOf(message) >= 0) {
            elementExist = true;
            break;
          }
        }
      }

      resolve(elementExist);
    });
  }

  protected async existElement(xPath: string, delayUntil: number = 5000): Promise<boolean> {
    return await new Promise<boolean>(async (resolve) => {
      await this.page
        .waitForXPath(xPath, { timeout: delayUntil, visible: true })
        .then(async () => await resolve(true))
        .catch(async () => await resolve(false));
    });
  }

  protected async waitForDialogAlert(ms: number = 5000) {
    return await new Promise(async (resolve) => {
      let currentTimeOut: number = 0;
      const timeout = setTimeout(async () => {
        currentTimeOut += 300;
        if (this.mensagemAlert || currentTimeOut >= ms) {
          resolve(true);
          clearTimeout(timeout);
        }
      }, 300);
    });
  }

  private async waitForDialogAlert2(ms: number = 5000, xPathSuccess?: string) {
    return await new Promise(async (resolve) => {
      const val: number = 301;
      let aux: number = 0;
      while (aux <= ms) {
        await delay(val);
        if (xPathSuccess) {
          if (!(await this.existElement(xPathSuccess))) {
            resolve(true);
          }
        }
        if (this.mensagemAlert) {
          aux = ms;
          resolve(true);
        } else {
          aux += val;
        }
      }
      resolve(false);
    });
  }

  protected async alert(msg: string) {
    await this.page.evaluate((value: string) => {
      alert(value);
    }, msg);
  }

  protected async scrollPageAxisXY(x: number = 0, y: number = 0) {
    await this.page.evaluate(() => {
      scrollTo(x !== 0 ? x : 0, y !== 0 ? y : 0);
    });
  }

  protected async keyboardPress(xPath: string, optionKey: 'Tab' | 'Enter' | 'Backspace') {
    await this.page.waitForXPath(xPath).then(async (el) => {
      await el.focus();
      await el.press(optionKey);
    });
  }

  protected async selectorInputValue(
    idSelector: string,
    keys: string,
    displayNone: boolean = false,
    waitFor: number = 301,
    hardValidation: boolean = true,
    delayHardValidation: number = 2000,
  ) {
    await delay(waitFor);
    await this.page
      .waitForSelector(idSelector, {
        visible: true,
        hidden: false,
      })
      .then(async (el: ElementHandle<HTMLOptionElement>) => {
        await el.select(keys);

        if (hardValidation) {
          await delay(delayHardValidation);
          const current = await el.evaluate((select) => {
            return select.value;
          });
          if (current !== keys) {
            await this.selectorInputValue(idSelector, keys, displayNone, waitFor, hardValidation);
          }
        }
      })
      .catch((e) => {
        throw e;
      });
  }

  protected verifyFrameIsOpened(identifier: string) {
    return new Promise<boolean>(async (resolve) => {
      let frame: Frame = await this.page.frames().find((f) => f.name() === identifier);
      if (!frame) {
        const element = await this.page.$(identifier);
        if (element) {
          frame = await element.contentFrame();
        }
      }

      resolve(!!frame);
    });
  }

  protected async click(xPath: string, waitFor: number = 301) {
    await delay(waitFor);
    if (await this.existElement(xPath)) {
      await this.page.waitForXPath(xPath).then(async (el) => {
        await el.focus();
        await el.click({ delay: 20 });
      });
    }
  }

  private async getTable(xPath: string): Promise<string> {
    return await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLTableElement>) => {
      return el.evaluate((table) => {
        return table.outerHTML;
      });
    });
  }

  protected async getValueCheckbox(xpath: string): Promise<boolean> {
    return await this.page
      .waitForXPath(xpath)
      .then(async (el: ElementHandle<HTMLInputElement>) => {
        return await el.evaluate((input) => {
          return input.checked;
        });
      })
      .catch((e) => {
        throw e;
      });
  }

  protected async getHrefFromAnchor(xPath: string): Promise<string> {
    return await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLAnchorElement>) => {
      return await el.evaluate((anchor) => {
        return anchor.href;
      });
    });
  }

  protected async getSrcFromImage(xPath: string): Promise<string> {
    return await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLImageElement>) => {
      return await el.evaluate((image) => {
        return image.src;
      });
    });
  }

  protected async getTitleFromElement(xPath: string): Promise<string> {
    return await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLImageElement | HTMLSpanElement>) => {
      return await el.evaluate((image) => {
        return image.title;
      });
    });
  }

  protected async sendKeys(xPath: string, keys: string, displayNone: boolean = false, hardValidation: boolean = false) {
    await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement | HTMLTextAreaElement>) => {
      await el.focus();
      if (this.option.browser === BrowserEnum.firefox) {
        await delay(301);
      }
      await el.type(keys, { delay: 20 });
      await el.evaluate((inp, elDisplayNone: boolean) => {
        if (elDisplayNone) {
          inp.style.color = 'transparent';
        }
      }, displayNone);

      if (hardValidation) {
        await el.press('Tab');
        await delay(2000);
        await el.focus();
        const current = await this.getTextContentOnInputElement(xPath);
        if (current !== keys) {
          await this.clearInput(xPath);
          await this.sendKeys(xPath, keys, displayNone, hardValidation);
        }
      }
    });
  }

  protected async getMessageAlert(xPathSuccess?: string, waitDialog: number = 60000): Promise<string> {
    await this.waitForDialogAlert2(waitDialog, xPathSuccess);
    return new Promise<string>(async (resolve) => {
      const msg: string = this.mensagemAlert;
      this.mensagemAlert = null;
      resolve(msg);
    });
  }

  protected async waitElementIsVisible(xPath: string, delayUntil: number = 600000): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const ii: number = 301;
      let aux: number = 0;
      while (aux <= delayUntil) {
        await delay(ii);
        if (await this.existElement(xPath, ii)) {
          resolve(true);
        } else {
          aux += ii * 2;
        }
      }
      resolve(false);
    });
  }

  protected async checkOnCheckBox(xPath: string) {
    await this.page.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement>) => {
      await el.evaluate((checkBox) => {
        checkBox.click();
      });
    });
  }

  protected async waitElementWhileIsVisible(xPath: string, delayUntil: number = 60000): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const ii: number = 301;
      let aux: number = 0;
      while (aux <= delayUntil) {
        await delay(ii);
        if (await this.existElement(xPath, ii)) {
          aux += ii * 2;
        } else {
          resolve(true);
        }
      }
      resolve(false);
    });
  }

  protected async selectorInputValueForXpath(
    xPathSelector: string,
    keys: string,
    displayNone: boolean = false,
    waitFor: number = 301,
  ) {
    await delay(waitFor);
    await this.page
      .waitForXPath(xPathSelector, {
        visible: true,
        hidden: false,
      })
      .then(async (el: ElementHandle<HTMLOptionElement>) => {
        await el.evaluate(
          (input, value: string, elDisplayNone: boolean) => {
            input.value = value;
            if (elDisplayNone) {
              input.style.color = 'transparent';
            }
          },
          keys,
          displayNone,
        );
      })
      .catch((e) => {
        throw e;
      });
  }

  protected async getOptionOnSelect(idSelect: string): Promise<string[]> {
    return new Promise<string[]>(async (resolve) => {
      const options = await this.page.evaluate((value: string) => {
        const optionsResult = [];
        const seletor = document.getElementById(value) as HTMLSelectElement;
        if (seletor) {
          for (const option of seletor.options) {
            optionsResult.push(option.value);
          }
          return optionsResult;
        }
      }, idSelect);
      resolve(options ?? []);
    }).catch((e) => {
      throw e;
    });
  }

  protected async clickOnMenuHover(xPathMenuUl: string, xPathClick: string) {
    await this.page.waitForXPath(xPathMenuUl).then(async (el: ElementHandle<HTMLUListElement>) => {
      await el.evaluate((input) => {
        input.style.display = 'block';
      });
    });
    await this.click(xPathClick);
  }

  private async initObservableDialog() {
    await this.page.removeAllListeners('dialog');
    this.page.on('dialog', async (dialog) => {
      this.mensagemAlert = await dialog.message();
      if ((this.option.ignoredMessages ?? []).find((message) => message === this.mensagemAlert)) {
        await dialog.accept();
      } else {
        if (!this._offDialog) {
          await dialog.dismiss();
        }
      }
    });
  }
}
