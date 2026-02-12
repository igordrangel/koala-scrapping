import type { Frame as PuppeteerFrame, Page as PuppeteerPage } from 'puppeteer'
import { DOM } from './Dom'
import { Frame } from './Frame'

export class Page extends DOM {
  constructor(page: PuppeteerPage) {
    super(page)
  }

  async getFrameByURL(url: string) {
    const frames = this.page.frames()
    const frame = frames.find((frame) => frame.url() === url)

    if (!frame) {
      throw new Error(`Frame with URL "${url}" not found`)
    }

    return new Frame(frame)
  }

  async getFrameByName(name: string) {
    const frames = this.page.frames()

    let frame: PuppeteerFrame | undefined

    for (const f of frames) {
      const frameElement = await f.frameElement()

      if (!frameElement) {
        continue
      }

      const frameName = await frameElement.evaluate((el) =>
        el.getAttribute('name'),
      )

      if (frameName === name) {
        frame = f
        break
      }

      const frameId = await frameElement.evaluate((el) => el.getAttribute('id'))

      if (frameId === name) {
        frame = f
        break
      }
    }

    if (!frame) {
      throw new Error(`Frame with name "${name}" not found`)
    }

    return new Frame(frame)
  }
}
