import * as fs from 'fs/promises';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {ChatOpenAI} from '@langchain/openai';
import {Task} from './Task';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import {useChatOpenAI} from '@clients/LangChainClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {ScrapingService} from '@services/ScrapingService';
import type {ArxivResponse} from '@model/tasks/Arxiv';

export class Arxiv extends Task {
  private scrapingService: ScrapingService;
  private openAiClient: OpenAiClient;
  private readonly chatOpenAI: ChatOpenAI;
  private readonly webUrl: string = 'https://centrala.ag3nts.org/dane/arxiv-draft.html';
  private readonly template: string =
    'Given the context: {context}, answer the following question: {question}. Answer in Polish. ' +
    "The photo taken was not in Grudządz. Use your internal knowledge with the 'Adasia' site to find the correct location. " +
    'Be concise, answer in one simple sentence. ' +
    "Pay special attention to the purpose of Bomba's experiment. " +
    'Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.openAiClient = new OpenAiClient();
    this.scrapingService = new ScrapingService();
  }

  async perform(): Promise<void> {
    try {
      const questions = await this.getQuestions();
      const webContent = await this.scrapingService.scrapeUrl(this.webUrl);

      if (webContent) {
        const imageResourceIds = this.getImageResources(webContent.content);
        for (const resource of imageResourceIds) {
          const buffer = await this.getResource(resource);
          const result = await this.openAiClient.interpretImage(Buffer.from(buffer));
          webContent.content = webContent.content.replace(resource, `Zawartość obrazu: ${result}`);
        }

        const audioResourceIds = this.getAudioResources(webContent.content);
        for (const resource of audioResourceIds) {
          const buffer = await this.getResource(resource);
          const result = await this.openAiClient.transcribeGroq(Buffer.from(buffer));
          webContent.content = webContent.content.replace(resource, `Transkrypcja audio: ${result}`);
        }

        const response: ArxivResponse = this.newResponse();
        for (const [id, question] of questions) {
          const result = await this.invoke(webContent.content, question);
          console.log(`Result for question ${id}: ${result}`);
          const key = `${id}` as keyof ArxivResponse;
          response[key] = result;
        }

        this.webClient
          .post<Json<ArxivResponse>, JsonResponse>('/report', this.createJson(response, 'arxiv'))
          .then(response => {
            console.log('Response from centrala:', response);
          })
          .catch(error => {
            console.error(error);
          });
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async invoke(context: string, question: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({context: context, question: question});
    return result;
  }

  private async getQuestions(): Promise<Map<string, string>> {
    const questionsPath = `${import.meta.dir}/../utils/files/arxiv/questions.txt`;
    const content = await fs.readFile(questionsPath, 'utf8');

    const questionsMap = new Map<string, string>();
    content.split('\n').forEach(line => {
      if (line.trim()) {
        const [id, question] = line.split('=');
        questionsMap.set(id, question);
      }
    });

    return questionsMap;
  }

  private async getResource(resourceId: string): Promise<Buffer> {
    const response = await this.webClient.get<Buffer>(`/dane/${resourceId}`, 'buffer');
    return response;
  }

  private getImageResources(webContent: string): string[] {
    const imageRegex = /i\/[^"\s]+\.png/g;
    const matches = webContent.match(imageRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private getAudioResources(webContent: string): string[] {
    const audioRegex = /i\/[^"\s]+\.mp3/g;
    const matches = webContent.match(audioRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private newResponse(): ArxivResponse {
    return {
      '01': '',
      '02': '',
      '03': '',
      '04': '',
      '05': '',
    };
  }
}
