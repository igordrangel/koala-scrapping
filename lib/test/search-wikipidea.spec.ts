import { TestVars } from './vars'

test('Test RPA search on wikipedia', async () => {
  const page = TestVars.page

  await page.goTo('https://pt.wikipedia.org')
  await page.click('#searchInput')
  await page.fill(
    '#searchform > div > div > div.cdx-text-input.cdx-text-input--has-start-icon.cdx-text-input--status-default.cdx-search-input__text-input > input',
    'Einstein',
  )
  await page.pressKey('Enter')

  const content = await page.content('#mw-content-text p')

  expect(content).toBeInstanceOf(Array)
  expect(content.length > 0).toBeTruthy()
})
