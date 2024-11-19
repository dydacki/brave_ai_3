import {Task} from './Task';
import type {Instructions} from '@model/tasks/RobotId';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';

export class RobotId extends Task {
  private readonly openAiClient: OpenAiClient;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    try {
      const instructions = await this.getInstructions<Instructions>('robotid.json');
      const imageDescription = instructions.description;
      const prompt = `Generate a robot image from the following description: ${imageDescription}`;
      const imageResponse = await this.openAiClient.generateImage(prompt);
      const imageUrl = imageResponse.data[0].url as string;
      console.log(imageUrl);
      const json = this.createJson(imageUrl, 'robotid');
      const response = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }
}
