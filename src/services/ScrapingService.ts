import FirecrawlApp from '@mendable/firecrawl-js';

export class ScrapingService {
  private firecrawlApp: FirecrawlApp;

  constructor() {
    this.firecrawlApp = new FirecrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});
  }

  async scrapeUrl(url: string): Promise<{url: string; content: string} | null> {
    try {
      const scrapeResult = await this.firecrawlApp.scrapeUrl(url, {formats: ['markdown']});
      if (scrapeResult.success && scrapeResult.markdown) {
        return {url, content: scrapeResult.markdown};
      }

      console.warn(`No markdown content found for URL: ${url}`);
      return null;
    } catch (error) {
      console.error(`Error scraping URL ${url}:`, error);
      return null;
    }
  }
}
