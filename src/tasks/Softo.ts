import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import type {VerificationQuestions} from '@model/tasks/Softo';

export class Softo extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly apiKey: string = process.env.AI_DEVS_API_KEY as string;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    const questions = await this.getQuestions();
    console.log(questions);
  }

  private async sendResponse<T>(arg: any): Promise<void> {
    const json = this.createJson<T>(arg, 'softo');
    const taskResponse = await this.webClient.post<Json<T>, JsonResponse>('/report', json);
    console.log(taskResponse);
  }

  private async getQuestions(): Promise<VerificationQuestions> {
    return this.webClient.get<VerificationQuestions>(`/data/${this.apiKey}/softo.json`);
  }
}
