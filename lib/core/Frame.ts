import { Frame as PuppeteerFrame } from 'puppeteer'
import { DOM } from './Dom'

export class Frame extends DOM {
  constructor(frame: PuppeteerFrame) {
    super(frame)
  }
}
