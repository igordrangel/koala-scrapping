import { TestVars } from './vars'

test('Test RPA search on google', async () => {
  const page = TestVars.dom

  await page.goTo(
    'https://pt.wikipedia.org/w/index.php?search=einstein+wikipedia&title=Especial:Pesquisar&ns0=1',
  )
  await page.click('.searchmatch')
  const content = await page.content('#mw-content-text p')
  expect(content).toBeInstanceOf(Array)
}, 20000)
