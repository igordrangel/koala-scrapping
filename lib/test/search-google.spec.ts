import { delay } from '@koalarx/utils'
import { TestVars } from './vars'

test('Test RPA search on google', async () => {
  const page = TestVars.dom

  await page.goTo('https://google.com')
  await page.fill('#APjFqb', 'einstein wikipedia')
  await page.click(
    'body > div.L3eUgb > div.o3j99.ikrT4e.om7nvf > form > div:nth-child(1) > div.A8SBwf > div.FPdoLc.lJ9FBc > center > input.gNO89b',
  )
  await delay(5000)
})
