import { TestVars } from './vars'

interface DatatableItem {
  name: string
  position: string
  office: string
  age: string
  startDate: string
  salary: string
}

test('Test RPA get datatable with paginator', async () => {
  const page = TestVars.page

  await page.goTo('https://datatables.net')
  const data = await page.getDatatable<DatatableItem>('#example', {
    withPagination: {
      nextButtonSelector:
        '#example_wrapper > div:nth-child(3) > div.dt-layout-cell.dt-layout-end > div > nav > button.dt-paging-button.next',
    },
  })

  expect(data).toBeInstanceOf(Array)
  expect(data.length).toBeGreaterThan(10)
  expect(data[0]).toHaveProperty('name')
  expect(data[0]).toHaveProperty('position')
  expect(data[0]).toHaveProperty('office')
  expect(data[0]).toHaveProperty('age')
  expect(data[0]).toHaveProperty('startDate')
  expect(data[0]).toHaveProperty('salary')
})
