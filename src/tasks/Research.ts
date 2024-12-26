import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import type {ChatCompletionMessageParam} from 'openai/resources/chat/completions';

export class Research extends Task {
  private readonly openAiClient: OpenAiClient;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    const response = await this.sendResponse('test');
    console.log(response);
  }

  private async sendResponse(arg: any): Promise<void> {
    const json = this.createJson(arg, 'research');
    const taskResponse = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
    console.log(taskResponse);
  }
}
