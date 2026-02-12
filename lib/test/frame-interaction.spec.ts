import { TestVars } from './vars'

test('Frame Interaction', async () => {
  const page = TestVars.page
  const urlFrame = 'https://pt.wikipedia.org'

  await page.goTo(`https://iframetester.com/?url=${urlFrame}`)

  const frame = await page.getFrameByName('iframe-window')

  await frame.click('#p-search > a')
  await frame.fill(
    '#searchform > div > div > div.cdx-text-input.cdx-text-input--has-start-icon.cdx-text-input--status-default.cdx-search-input__text-input > input',
    'Einstein',
  )
  await frame.pressKey('Enter')

  const content = await frame.content('#mw-content-text p')

  expect(content).toBeInstanceOf(Array)
  expect(content.length > 0).toBeTruthy()
})
