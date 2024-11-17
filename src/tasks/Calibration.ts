import {Task} from './Task';
import {ChatOpenAI} from '@langchain/openai';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import {MathTokenizer} from '@utils/tokenizers/MathTokenizer';
import {WebClient} from '@clients/WebClient';
import type {CalibrationData, Json, JsonResponse} from '@model/tasks/Calibration';

export class Calibration extends Task {
  private readonly arithmeticRegex: RegExp = /^\s*(\d+)\s*([+\-*/])\s*(\d+)\s*$/;
  private readonly chatOpenAI: ChatOpenAI;
  private readonly webClient: WebClient;
  private readonly mathTokenizer: MathTokenizer;
  private readonly template: string =
    'Answer the question: "{question}". Return answer for the question in ENGLISH language, ' +
    'Be precise and concise. Answer in one sentence, with as few words as possible. ' +
    "If answer is possible with one word, don't use more. Answer:";

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.webClient = new WebClient('https://centrala.ag3nts.org/report');
    this.mathTokenizer = new MathTokenizer();
  }

  async perform(): Promise<void> {
    const data = await this.readJsonFile(`${import.meta.dir}/../utils/files/calibration.json`);
    data['test-data'].forEach(async problem => {
      if (this.arithmeticRegex.test(problem.question)) {
        const tokens = this.mathTokenizer.tokenize(problem.question);
        const result = this.mathTokenizer.evaluate(tokens);
        if (result !== problem.answer) {
          problem.answer = result;
        }

        if (problem.test && problem.test.a === '???') {
          let answer = await this.answerQuestion(problem.test.q);
          problem.test.a = answer.replace('.', '');
        }
      }
    });

    try {
      const json = this.createJson(data);
      console.log(json);
      const response = await this.webClient.post<Json<CalibrationData>, JsonResponse>('/report', this.createJson(data));
      console.log(response);
    } catch (error) {
      console.error(error);
    }
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

  private createJson(t: CalibrationData): Json<CalibrationData> {
    t.apikey = process.env.POLYGON_API_KEY as string;
    return {
      task: 'JSON',
      answer: t,
      apikey: process.env.POLYGON_API_KEY as string,
    };
  }
}
