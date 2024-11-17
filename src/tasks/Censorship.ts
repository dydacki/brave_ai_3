import {Task} from './Task';
import {ChatOpenAI} from '@langchain/openai';
import {useChatOpenAI} from '@clients/LangChainClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
export class Censorship extends Task {
  private readonly chatOpenAI: ChatOpenAI;
  private readonly template: string =
    'Replace the personal data in the : "{sentence}" with the word "CENZURA". The data to replace: ' +
    '1. Full name, ' +
    '2. Age, ' +
    '3. Address.' +
    '<replacement rules>' +
    '1. In case of age, replace only the number, if there are words describing the age, replace them all.' +
    '2. In case of age, DO NOT replace the word "lat".' +
    '3. In case of address, replace the city name with one word "CENZURA" and the street name including number with another one.' +
    '3. DO NOT REMOVE PERIODS OR COMMMAS. Leave the sentence structure intact.' +
    '</replacement rules>' +
    '<example>' +
    '1. UNCENSORED: Podejrzany: Krzysztof Kwiatkowski. Mieszka w Szczecinie przy ul. Różanej 12. Ma 31 lat.' +
    '2. CENSORED: Podejrzany: CENZURA. Mieszka w CENZURA przy ul. CENZURA. Ma CENZURA lat.' +
    '</example>' +
    ' Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
  }

  async perform(): Promise<void> {
    try {
      const content = await this.getStringToCensor();
      const censoredSentence = await this.censorSentence(content);
      const json = this.createJson(censoredSentence, 'CENZURA');
      console.log(json);

      const response = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  private async getStringToCensor(): Promise<string> {
    const apiKey = process.env.POLYGON_API_KEY;
    return this.webClient.get<string>(`/data/${apiKey}/cenzura.txt`);
  }

  private async censorSentence(sentence: String): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({sentence: sentence});
    return result;
  }
}
