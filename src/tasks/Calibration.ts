import {Task} from './Task';
import {ChatOpenAI} from '@langchain/openai';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import {WebClient} from '@clients/WebClient';
import type {CalibrationData} from '@model/tasks/Calibration';

export class Calibration extends Task {
  private readonly chatOpenAI: ChatOpenAI;
  private readonly webClient: WebClient;
  private readonly template: string =
    'Answer the question: "{question}". Return answer for the question in POLISH language, ' +
    'Be precise and concise. Answer in one sentence, with as few words as possible. Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.webClient = new WebClient('https://xyz.ag3nts.org');
  }

  async perform(): Promise<void> {
    const data = await this.readJsonFile('./utils/files/json.json');
    console.log(data);
  }

  async readJsonFile(filePath: string): Promise<CalibrationData> {
    const file = await Bun.file(filePath).text();
    return JSON.parse(file);
  }

  private async answerQuestion(question: String): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({question: question});
    return result;
  }
}
