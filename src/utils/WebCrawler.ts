import * as cheerio from 'cheerio';
import type {CheerioAPI} from 'cheerio';
import type {ParsedContent} from '@model/webCrawler/ParsedContent.js';
import type {WebPageContent} from '@model/webCrawler/WebPageContent';
import prettier from 'prettier';

export class WebCrawler {
  public async fetchPage(url: string): Promise<WebPageContent> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = cheerio.load(html);
      const prettyHtml = await prettier.format(html, {
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore',
      });

      return {
        url,
        title: parser('title').text(),
        html: prettyHtml,
        parser,
      };
    } catch (error) {
      console.error(`Error fetching page ${url}:`, error);
      throw error;
    }
  }

  public async parseContent<T>(url: string, parser: (document: CheerioAPI) => T): Promise<ParsedContent<T>> {
    const page = await this.fetchPage(url);
    const data = parser(page.parser);

    return {
      url,
      data,
    };
  }
}
