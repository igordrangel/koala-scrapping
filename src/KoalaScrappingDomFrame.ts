import { Browser, ElementHandle, Frame } from 'puppeteer';
import { delay } from '@koalarx/utils/operators/delay';
import { toCamelCase } from '@koalarx/utils/operators/string';

import htmlTableToJson from 'html-table-to-json';

export class KoalaScrappingDomFrame {
  protected browser: Browser;
  protected idCaptcha: string;
  private mensagemAlert: string;

  constructor(protected frame: Frame) { }

  public async getDataFromTable<LineType>(xPath: string, waitUntil: number = 10000): Promise<LineType[]> {
    return await this.getTable(xPath, waitUntil)
      .then(async (tableHtml) => {
        const tmpResult = htmlTableToJson.parse(tableHtml).results[0];
        const result: LineType[] = [];
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
          result.push(newObj as any);
        });
        return result;
      })
      .catch(() => []);
  }

  public async clearInput(xpath: string) {
    await this.frame
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

  public async pasteValueInField(
    xPath: string,
    keys: string,
    displayNone: boolean = false,
    hardValidation: boolean = false,
    valueFix: boolean = false,
  ) {
    if (await this.existElement(xPath)) {
      await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement>) => {
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

  public async writeTextInField(xPath: string, value: string) {
    await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement | HTMLTextAreaElement>) => {
      await el.focus();
      await el.type(value, { delay: 20 });
    });
  }

  public async waitForXpathIsNotVisible(xPath: string, waitFor: number = 2000) {
    let isVisible: boolean = true;
    while (isVisible) {
      await delay(waitFor);
      isVisible = await this.existElement(xPath);
    }
  }

  public async displayNone(xpath: string) {
    await this.frame.waitForXPath(xpath).then(async (el: ElementHandle<HTMLInputElement | HTMLLabelElement>) => {
      await el.evaluate((input) => {
        input.style.display = 'none';
      });
    });
  }

  public async displayVisible(xpath: string) {
    await this.frame.waitForXPath(xpath).then(async (el: ElementHandle<HTMLInputElement | HTMLLabelElement>) => {
      await el.evaluate((input) => {
        input.style.removeProperty('display');
      });
    });
  }

  public async getTextContentOnElement(xPath: string, delayUntil: number = 1000): Promise<string> {
    return await this.frame
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

  public async getTextContentOnInputElement(xPath: string): Promise<string> {
    return await this.frame
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

  public existElementOnList(xPathList: string[], containsMessageError: string[] = [], delayUntil: number = 5000) {
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

  public async existElement(xPath: string, delayUntil: number = 5000): Promise<boolean> {
    return await new Promise<boolean>(async (resolve) => {
      await this.frame
        .waitForXPath(xPath, { timeout: delayUntil, visible: true })
        .then(async () => await resolve(true))
        .catch(async () => await resolve(false));
    });
  }

  public async waitForDialogAlert(ms: number = 5000) {
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

  public async alert(msg: string) {
    await this.frame.evaluate((value: string) => {
      alert(value);
    }, msg);
  }

  public async scrollPageAxisXY(x: number = 0, y: number = 0) {
    await this.frame.evaluate(() => {
      scrollTo(x !== 0 ? x : 0, y !== 0 ? y : 0);
    });
  }

  public async keyboardPress(xPath: string, optionKey: 'Tab' | 'Enter' | 'Backspace') {
    await this.frame.waitForXPath(xPath).then(async (el) => {
      await el.focus();
      await el.press(optionKey);
    });
  }

  public async selectorInputValue(
    idSelector: string,
    keys: string,
    displayNone: boolean = false,
    waitFor: number = 301,
    hardValidation: boolean = true,
    delayHardValidation: number = 2000,
  ) {
    await delay(waitFor);
    await this.frame
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

  public async click(xPath: string, waitFor: number = 301) {
    await delay(waitFor);
    if (await this.existElement(xPath)) {
      await this.frame.waitForXPath(xPath).then(async (el) => {
        await el.focus();
        await el.click({ delay: 20 });
      });
    }
  }

  private async getTable(xPath: string, waitUntil: number = 10000): Promise<string> {
    return await this.frame
      .waitForXPath(xPath, { timeout: waitUntil })
      .then(async (el: ElementHandle<HTMLTableElement>) => {
        return el.evaluate((table) => {
          return table.outerHTML;
        });
      });
  }

  public async getValueCheckbox(xpath: string): Promise<boolean> {
    return await this.frame
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

  public async getHrefFromAnchor(xPath: string): Promise<string> {
    return await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLAnchorElement>) => {
      return await el.evaluate((anchor) => {
        return anchor.href;
      });
    });
  }

  public async getSrcFromImage(xPath: string): Promise<string> {
    return await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLImageElement>) => {
      return await el.evaluate((image) => {
        return image.src;
      });
    });
  }

  public async getTitleFromElement(xPath: string): Promise<string> {
    return await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLImageElement | HTMLSpanElement>) => {
      return await el.evaluate((image) => {
        return image.title;
      });
    });
  }

  public async sendKeys(xPath: string, keys: string, displayNone: boolean = false, hardValidation: boolean = false) {
    await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement | HTMLTextAreaElement>) => {
      await el.focus();
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

  public async getMessageAlert(xPathSuccess?: string, waitDialog: number = 60000): Promise<string> {
    await this.waitForDialogAlert2(waitDialog, xPathSuccess);
    return new Promise<string>(async (resolve) => {
      const msg: string = this.mensagemAlert;
      this.mensagemAlert = null;
      resolve(msg);
    });
  }

  public async waitElementIsVisible(xPath: string, delayUntil: number = 600000): Promise<boolean> {
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

  public async checkOnCheckBox(xPath: string) {
    await this.frame.waitForXPath(xPath).then(async (el: ElementHandle<HTMLInputElement>) => {
      await el.evaluate((checkBox) => {
        checkBox.click();
      });
    });
  }

  public async waitElementWhileIsVisible(xPath: string, delayUntil: number = 60000): Promise<boolean> {
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

  public async selectorInputValueForXpath(
    xPathSelector: string,
    keys: string,
    displayNone: boolean = false,
    waitFor: number = 301,
  ) {
    await delay(waitFor);
    await this.frame
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

  public async getOptionOnSelect(idSelect: string): Promise<string[]> {
    return new Promise<string[]>(async (resolve) => {
      const options = await this.frame.evaluate((value: string) => {
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

  public async clickOnMenuHover(xPathMenuUl: string, xPathClick: string) {
    await this.frame.waitForXPath(xPathMenuUl).then(async (el: ElementHandle<HTMLUListElement>) => {
      await el.evaluate((input) => {
        input.style.display = 'block';
      });
    });
    await this.click(xPathClick);
  }
}
