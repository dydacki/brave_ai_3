import * as path from 'path';
import * as fs from 'fs/promises';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {ChatOpenAI} from '@langchain/openai';
import {Task} from './Task';
import {FileUtils} from '@utils/FileUtils';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import {useChatOpenAI} from '@clients/LangChainClient';
import type {Summary} from '@model/tasks/Categories';
import type {Json, JsonResponse} from '@model/tasks/Task';

export class Categories extends Task {
  private openAiClient: OpenAiClient;
  private readonly chatOpenAI: ChatOpenAI;
  private readonly inputDir = `${import.meta.dir}/../utils/files/categories`;
  private readonly template: string =
    'You are going to interpret the report text from the robots factory: {reportText}. ' +
    'If the report text contains information about captured people OR ANY TRACES OF THEIR PRESENCE, reply with "people". ' +
    'If the report text contains information about hardware fixes, reply with "hardware". ' +
    'If the report contains some other information, reply with "none" and add a one-sentence explanation why. ' +
    'Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    const filesByExtension = this.mapFilesByExtension(await this.getAllFiles());

    const textFiles = filesByExtension.get('txt') ?? [];
    const audioFiles = filesByExtension.get('mp3') ?? [];
    const imageFiles = filesByExtension.get('png') ?? [];

    const summary: Summary = {
      people: [],
      hardware: [],
    };

    try {
      const audioFileContents = await this.transcribeAudioFiles(audioFiles);
      const textFileContents = await this.getTextContents(textFiles);
      const imageFileContents = await this.getImageContents(imageFiles);
      const textContents = new Map([...textFileContents, ...imageFileContents, ...audioFileContents]);

      for (const [file, content] of textContents) {
        const result = await this.invoke(content);
        if (result === 'people') {
          summary.people.push(file);
        } else if (result === 'hardware') {
          summary.hardware.push(file);
        } else {
          console.info(`Unknown category for file ${file}: ${result}`);
        }
      }

      const response = await this.webClient.post<Json<Summary>, JsonResponse>(
        '/report',
        this.createJson(summary, 'kategorie'),
      );
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  private async getAllFiles(): Promise<string[]> {
    const types = ['txt', 'mp3', 'png'];
    const files = await FileUtils.getFilesWithExtension(`${import.meta.dir}/../utils/files/categories`, types);
    return files.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  }

  private mapFilesByExtension(files: string[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    files.forEach(file => {
      const extension = file.split('.').pop() || '';
      map.set(extension, [...(map.get(extension) ?? []), file]);
    });

    return map;
  }

  private async transcribeAudioFiles(audioFiles: string[]): Promise<Map<string, string>> {
    const audioContents = new Map<string, string>();

    await Promise.all(
      audioFiles.map(async file => {
        const audioBuffer = await fs.readFile(path.join(this.inputDir, file));
        const transcription = await this.openAiClient.transcribeGroq(audioBuffer);
        audioContents.set(file, transcription);
      }),
    );

    return audioContents;
  }

  private async getTextContents(textFiles: string[]): Promise<Map<string, string>> {
    const textContents = new Map<string, string>();
    await Promise.all(
      textFiles.map(async file => textContents.set(file, await fs.readFile(path.join(this.inputDir, file), 'utf8'))),
    );
    return textContents;
  }

  private async getImageContents(imageFiles: string[]): Promise<Map<string, string>> {
    const imageContents = new Map<string, string>();
    await Promise.all(
      imageFiles.map(async file => {
        const imageBuffer = await fs.readFile(path.join(this.inputDir, file));
        const text = await this.openAiClient.readImageText(imageBuffer);
        imageContents.set(file, text);
      }),
    );
    return imageContents;
  }

  private async invoke(reportText: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({reportText: reportText});
    return result;
  }
}
