import { rmSync } from 'node:fs'
import { TestVars } from './vars'

test('Test RPA download file', async () => {
  const page = TestVars.page

  await page.goTo('https://proof.ovh.net/files/')
  await page.click(
    '#main > table > tbody > tr:nth-child(2) > td:nth-child(1) > a',
  )

  const files = await page.getDownloadedFiles()

  expect(files.length).toBeGreaterThan(0)
  expect(files[0]).toBeInstanceOf(Buffer)

  rmSync('downloads', { recursive: true, force: true })
}, 15000)
