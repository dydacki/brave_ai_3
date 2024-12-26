import {Task} from './Task';
import {messages, functions, visionModelMessage} from '@utils/constants/Photos';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {ChatCompletionMessageParam} from 'openai/resources/chat/completions';

export class Photos extends Task {
  private readonly openAiClient: OpenAiClient;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    const instruction = await this.getPhotosInstructions();
    const completionMessage = {role: 'user', content: instruction} as ChatCompletionMessageParam;
    const modelMessages = [...messages, completionMessage] as ChatCompletionMessageParam[];

    try {
      const completionParams = {
        messages: modelMessages,
        functions,
        functionCallbacks: {
          fetchImages: this.fetchImages.bind(this),
          brighten: this.brighten.bind(this),
          darken: this.darken.bind(this),
          repair: this.repair.bind(this),
          interpretImage: this.interpretImage.bind(this),
        },
      } as Parameters<typeof this.openAiClient.completionWithFunctions>[0];

      const response = (await this.openAiClient.completionWithFunctions(completionParams)) as string;
      console.log(response);
      const json = this.createJson<string>(response, 'photos');
      const taskResponse = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
      console.log(taskResponse);
    } catch (error) {
      console.error(error);
    }
  }

  private async sendInstruction(instruction: string): Promise<JsonResponse> {
    const json = this.createJson(instruction, 'photos');
    const taskResponse = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
    return taskResponse;
  }

  private async getPhotosInstructions(): Promise<string> {
    const json = await this.sendInstruction('START');
    return json.message;
  }

  private async fetchImages(param: {imageUrls: string[]}): Promise<Buffer[]> {
    const imagePromises = param.imageUrls.map(url => this.webClient.get<Buffer>(url, 'buffer'));
    return Promise.all(imagePromises);
  }

  private async brighten(param: {imageUrl: string}): Promise<string> {
    const imageUrl = param.imageUrl;
    const result = await this.sendInstruction(`BRIGHTEN ${imageUrl}`);
    return result.message;
  }

  private async darken(param: {imageUrl: string}): Promise<string> {
    const imageUrl = param.imageUrl;
    const result = await this.sendInstruction(`DARKEN ${imageUrl}`);
    return result.message;
  }

  private async repair(param: {imageUrl: string}): Promise<string> {
    const imageUrl = param.imageUrl;
    const result = await this.sendInstruction(`REPAIR ${imageUrl}`);
    return result.message;
  }

  private async interpretImage(param: {buffer: Buffer}): Promise<string> {
    const imgBuffer = param.buffer;
    const instructions = visionModelMessage.content as string;
    const result = await this.openAiClient.interpretImageWithInstructions(imgBuffer, instructions);
    return result;
  }
}
