import { delay, KlDate } from '@koalarx/utils'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { KeyInput, Page } from 'puppeteer'

export class DOM {
  constructor(private readonly page: Page) {}

  async close() {
    await this.page.close()
  }

  async screenshot() {
    const folderPath = './screenshots'

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath)
    }

    const screenshotPath = path.join(
      folderPath,
      `${new KlDate().format('ddMMyyyyHHmmss')}.jpg`,
    )

    await this.page.screenshot({ path: screenshotPath })
  }

  async goTo(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  async fill(selector: string, value: string) {
    await this.page.locator(selector).fill(value)
  }

  async pressKey(key: KeyInput, combine?: KeyInput) {
    if (combine) {
      await this.page.keyboard.down(combine)
    }

    await this.page.keyboard.press(key)
  }

  async click(selector: string) {
    await this.page.click(selector)
  }

  async content(selector: string) {
    return this.page.$$eval(selector, (elements) => {
      return elements.map((el) => el.innerText.trim() as string)
    })
  }
}
