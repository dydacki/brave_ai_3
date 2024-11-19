import type {Json} from '@model/tasks/Task';
import {WebClient} from '@clients/WebClient';

export abstract class Task {
  protected readonly webClient: WebClient;

  protected constructor() {
    this.webClient = new WebClient('https://centrala.ag3nts.org');
  }

  abstract perform(): Promise<void>;

  protected createJson<T>(t: T, task: string): Json<T> {
    return {
      task,
      answer: t,
      apikey: process.env.POLYGON_API_KEY as string,
    };
  }

  protected async getInstructions<T>(endpoint: string): Promise<T> {
    const url = `/data/${process.env.AI_DEVS_API_KEY}/${endpoint}`;
    const response = await this.webClient.get<T>(url);
    return response;
  }
}
