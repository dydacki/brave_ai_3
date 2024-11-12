import {type CheerioAPI} from 'cheerio';

export interface WebPageContent {
  url: string;
  title: string;
  html: string;
  parser: CheerioAPI; // renamed from $
}
