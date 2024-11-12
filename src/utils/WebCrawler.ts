import * as cheerio from 'cheerio';
import type {CheerioAPI} from 'cheerio';
import type {ParsedContent} from '@model/webCrawler/ParsedContent.js';
import type {WebPageContent} from '@model/webCrawler/WebPageContent';

export class WebCrawler {
  public async fetchPage(url: string): Promise<WebPageContent> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = cheerio.load(html); // renamed from $

      return {
        url,
        title: parser('title').text(),
        html,
        parser,
      };
    } catch (error) {
      console.error(`Error fetching page ${url}:`, error);
      throw error;
    }
  }

  public async parseContent<T>(
    url: string,
    parser: (document: CheerioAPI) => T, // renamed parameter
  ): Promise<ParsedContent<T>> {
    const page = await this.fetchPage(url);
    const data = parser(page.parser); // using new name

    return {
      url,
      data,
    };
  }
}
