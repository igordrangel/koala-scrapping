import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer'
import { BROWSER_ARGS } from './constants/args'
import { DOM } from './Dom'

export interface BrowserConfig {
  headless?: boolean
  proxy?: string
  minimalist?: boolean
  slowMo?: number
}

export class Browser {
  private browser?: PuppeteerBrowser
  private dom?: DOM

  constructor(private config: BrowserConfig) {}

  get page() {
    if (!this.dom) {
      throw new Error('DOM is not lauched. Certificate you call init method.')
    }

    return this.dom
  }

  async init() {
    const { headless, proxy, minimalist, slowMo } = this.config

    const args = BROWSER_ARGS.concat(
      proxy ? [`--proxy-server=${proxy}`] : [],
    ).concat(headless ? [] : ['--start-maximized'])

    const browser = await puppeteer.launch({
      args,
      headless,
      defaultViewport: null,
      slowMo,
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

    this.browser = browser
    this.dom = new DOM(page)

    return this
  }

  async close() {
    if (!this.browser) {
      throw new Error(
        'Browser is not lauched. Certificate you call init method.',
      )
    }

    await this.page.close()
    await this.browser.close()
  }
}
