import { KoalaScrappingSystem } from '../KoalaScrappingSystem';
jest.setTimeout(10000000);
test('Scrapping Google', async () => {
  const google = new (class Google extends KoalaScrappingSystem<any> {
    constructor() {
      super({
        url: 'https://google.com',
        loadMinimalist: true,
      });
    }

    public async search(wordSearch: string) {
      await this.init();
      await this.pasteValueInField('/html/body/div[1]/div[3]/form/div[1]/div[1]/div[1]/div/div[2]/input', wordSearch);
      await this.click('/html/body/div[1]/div[3]/form/div[1]/div[1]/div[4]/center/input[1]');

      const result = await this.getTextContentOnElement('//*[@id="result-stats"]');

      await this.closeDOM();

      return result;
    }
  })();

  expect(await google.search('test')).toContain('resultados');
});

// test('Download Test', async () => {
//   const download = new (class Download extends KoalaScrappingSystem<any> {
//     constructor() {
//       super({
//         url: 'https://speed.hetzner.de',
//         loadMinimalist: true,
//         allowDownload: true,
//       });
//     }

//     public async getFiles() {
//       await this.init();
//       await this.click('/html/body/p[1]/a');
//       await this.waitDownloadFiles();
//       const files = this.getDownloadedFiles();
//       await this.closeDOM();
//       return files;
//     }
//   })();

//   expect((await download.getFiles())?.length > 0).toEqual(true);
// });

test('Datatable Test', async () => {
  const datatable = new (class Datatable extends KoalaScrappingSystem<any> {
    constructor() {
      super({
        url: 'https://datatables.net',
        loadMinimalist: true,
      });
    }

    public async getData() {
      await this.init();
      const items = await this.getDataFromTable<any>('//*[@id="example"]', 1000);
      await this.closeDOM();
      return items;
    }
  })();

  expect((await datatable.getData())?.length > 0).toEqual(true);
});

// test('Proxy Test', async () => {
//   const google = new (class Google extends KoalaScrappingSystem<any> {
//     constructor() {
//       super({
//         url: 'https://bemweb.bempromotora.com.br',
//         proxy: {
//           host: '200.170.175.71:8081',
//           username: 'teste',
//           password: 'teste',
//         },
//       });
//     }

//     public async search(wordSearch: string) {
//       await this.init(false);
//       await this.pasteValueInField('/html/body/div[1]/div[3]/form/div[1]/div[1]/div[1]/div/div[2]/input', wordSearch);
//       await this.click('/html/body/div[1]/div[3]/form/div[1]/div[1]/div[4]/center/input[1]');

//       const result = await this.getTextContentOnElement('//*[@id="result-stats"]');

//       await this.closeDOM();

//       return result;
//     }
//   })();

//   expect(await google.search('test')).toContain('resultados');
// });
