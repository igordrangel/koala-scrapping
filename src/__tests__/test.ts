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
      await this.click('/html/body/div[1]/div[3]/form/div[1]/div[1]/div[3]/center/input[1]');

      const result = await this.getTextContentOnElement('//*[@id="result-stats"]');

      await this.closeDOM();

      return result;
    }
  })();

  expect(await google.search('test')).toContain('resultados');
});
