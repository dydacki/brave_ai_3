import {Task} from './Task';
import type {Instructions} from '@model/tasks/RobotId';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import type {ChatOpenAI} from '@langchain/openai';

export class RobotId extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly chatOpenAI: ChatOpenAI;
  private readonly template: string =
    'Go through the following description: "{description}" and find out: ' +
    '1. WHAT is described? ' +
    '2. Its most important described features. ' +
    '3. Remove all the emotions and other words that do not describe the object. ' +
    '4. To describe the object, use phrases like "it has...", "it moves...", "it does..." ' +
    '5. Reply in a concise and clear sentence WHAT the descripion contains and WHAT the most important features are. NO BULLET POINTS.' +
    "6. Don't repeat yourself. " +
    'Answer:';

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
    this.chatOpenAI = useChatOpenAI();
  }

  async perform(): Promise<void> {
    try {
      const instructions = await this.getTaskInstructions();
      const refinedDescription = await this.refineImageDescription(instructions.description);
      const imageResponse = await this.openAiClient.generateImage(refinedDescription);
      const imageUrl = imageResponse.data[0].url as string;
      console.log(imageUrl);
      const json = this.createJson(imageUrl, 'robotid');
      const response = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  private async refineImageDescription(description: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({description: description});
    return result;
  }

  private async getTaskInstructions(): Promise<Instructions> {
    const instructions = await this.getInstructions<string>('robotid.json');
    return (await JSON.parse(instructions)) as Instructions;
  }
}
