import { Browser } from '../core/Browser'
import { TestVars } from './vars'

beforeAll(async () => {
  TestVars.browser = await new Browser({
    minimalist: false,
    headless: false,
  }).init()
  TestVars.page = TestVars.browser.page
})

afterAll(async () => {
  await TestVars.browser.close()
})
