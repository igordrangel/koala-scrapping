import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer'
import type { BrowserConfig } from './@types/browser-config'
import { BROWSER_ARGS } from './constants/args'
import { Page } from './Page'
import { existsSync, mkdirSync } from 'node:fs'

export class Browser {
  private _browser?: PuppeteerBrowser
  private _page?: Page

  constructor(private config: BrowserConfig) {}

  get page() {
    if (!this._page) {
      throw new Error('DOM is not lauched. Certificate you call init method.')
    }

    return this._page
  }

  async init() {
    const { headless, proxy, minimalist, slowMo } = this.config

    const downloadPath = this.config.downloadFolderPath ?? './downloads'

    if (!existsSync(downloadPath)) {
      mkdirSync(downloadPath)
    }

    const args = BROWSER_ARGS.concat(
      proxy ? [`--proxy-server=${proxy}`] : [],
    ).concat(headless ? [] : ['--start-maximized'])

    const browser = await puppeteer.launch({
      args,
      headless,
      defaultViewport: null,
      slowMo,
      downloadBehavior: {
        policy: 'allow',
        downloadPath,
      },
    })

    const page = await browser.pages().then((pages) => pages[0]!)

    if (minimalist) {
      page.removeAllListeners('request')

      await page.setRequestInterception(true)

      page.on('request', (req) => {
        if (
          req.resourceType() === 'stylesheet' ||
          req.resourceType() === 'font' ||
          req.resourceType() === 'image'
        ) {
          req.abort()
        } else {
          req.continue()
        }
      })
    }

    this._browser = browser
    this._page = new Page(page)

    return this
  }

  async close() {
    if (!this._browser) {
      throw new Error(
        'Browser is not lauched. Certificate you call init method.',
      )
    }

    await this._page.close()
    await this._browser.close()
  }
}
