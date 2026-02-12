import { Browser } from '../core/Browser'
import { TestVars } from './vars'

beforeAll(async () => {
  TestVars.browser = await new Browser({
    minimalist: true,
  }).init()
  TestVars.dom = TestVars.browser.page
})

afterAll(async () => {
  await TestVars.browser.close()
})
