import { delay, KlDate, toCamelCase } from '@koalarx/utils'
import htmlTableToJson from 'html-table-to-json'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { KeyInput, Page } from 'puppeteer'
import { Frame as PuppeteerFrame } from 'puppeteer'
import type { DOMOptions } from './@types/dom-options'
import type { GetDatatableOptions } from './@types/get-datatable-options'

export class DOM {
  constructor(
    private readonly _page: Page | PuppeteerFrame,
    private readonly _options?: DOMOptions,
  ) {}

  protected get page() {
    return this._page instanceof PuppeteerFrame ? this._page.page() : this._page
  }

  async close() {
    await this.page.close()
  }

  async screenshot() {
    const folderPath = this._options?.screenshotFolderPath ?? './screenshots'

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath)
    }

    const screenshotPath = path.join(
      folderPath,
      `${new KlDate().format('ddMMyyyyHHmmss')}.jpg`,
    )

    await this.page.screenshot({ path: screenshotPath })
  }

  async pressKey(key: KeyInput, combine?: KeyInput) {
    if (combine) {
      await this.page.keyboard.down(combine)
    }

    await this.page.keyboard.press(key)
  }

  async goTo(url: string) {
    await this._page.goto(url, { waitUntil: 'networkidle2' })
  }

  async fill(selector: string, value: string) {
    await this._page.locator(selector).scroll()
    await this._page.focus(selector)
    await this._page.locator(selector).fill(value)
  }

  async click(selector: string) {
    await this._page.locator(selector).scroll()
    await this._page.click(selector)
  }

  async focus(selector: string) {
    await this._page.locator(selector).scroll()
    await this._page.focus(selector)
  }

  async content(selector: string) {
    await this._page.locator(selector).scroll()
    return this._page.$$eval(selector, (elements) => {
      return elements.map(
        (el) => (el as HTMLElement).innerText.trim() as string,
      )
    })
  }

  async getDatatable<T = any>(
    selector: string,
    options?: GetDatatableOptions,
  ): Promise<T[]> {
    const table = await this._page.$eval(selector, (table) => table.outerHTML)
    const tableData = htmlTableToJson.parse(table).results[0]
    const result: T[] = tableData.map((row) => {
      const rowData: Record<string, string> = {}

      Object.keys(row).forEach((key) => {
        const value = row[key]
        const numberValue = Number(value)
        rowData[toCamelCase(key)] = isNaN(numberValue) ? value : numberValue
      })

      return rowData as T
    })

    if (options?.withPagination) {
      const nextButtonSelector = options.withPagination.nextButtonSelector
      const nextButton = await this._page.$(nextButtonSelector)

      if (
        nextButton &&
        !(await nextButton.evaluate(
          (btn) =>
            btn.classList.contains('disabled') || btn.hasAttribute('disabled'),
        ))
      ) {
        await nextButton.click()
        const nextPageData = await this.getDatatable(selector, options)
        result.push(...nextPageData)
      }
    }

    return result
  }

  async waitNavigation() {
    await this._page
      .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 })
      .catch(() => null)
  }

  async getDownloadedFiles() {
    const downloadPath = this._options?.downloadFolderPath ?? './downloads'

    if (existsSync(downloadPath)) {
      let contentDir = []

      do {
        await delay(1000)
        contentDir = readdirSync(downloadPath)
      } while (
        contentDir.filter((filepath) => filepath.indexOf('.crdownload') >= 0)
          .length > 0
      )

      const files: Buffer[] = []

      contentDir.forEach((filepath) =>
        files.push(readFileSync(`${downloadPath}/${filepath}`)),
      )
      return files
    }

    return []
  }
}
