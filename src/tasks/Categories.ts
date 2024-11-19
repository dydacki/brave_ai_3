import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import type {ChatOpenAI} from '@langchain/openai';

export class Categories extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly chatOpenAI: ChatOpenAI;
  private readonly template: string =
    'Analyze the following text: "{text}" and: ' +
    '1. Identify the main categories or themes present. ' +
    '2. Group related concepts together. ' +
    '3. Provide a clear, structured categorization. ' +
    '4. Use concise language and avoid redundancy. ' +
    '5. Format the response as a comma-separated list of categories. ' +
    'Categories:';

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
    this.chatOpenAI = useChatOpenAI();
  }

  async perform(): Promise<void> {
    try {
      const categories = await this.analyzeCategories('some categories');
      const json = this.createJson(categories, 'kategorie');
      const response = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  private async analyzeCategories(text: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({text: text});
    return result;
  }
}
