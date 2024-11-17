import type {Json} from '@model/tasks/Task';
import {WebClient} from '@clients/WebClient';

export abstract class Task {
  protected readonly webClient: WebClient;

  protected constructor() {
    this.webClient = new WebClient('https://centrala.ag3nts.org/report');
  }

  abstract perform(): Promise<void>;

  protected createJson<T>(t: T, task: string): Json<T> {
    return {
      task,
      answer: t,
      apikey: process.env.POLYGON_API_KEY as string,
    };
  }
}
